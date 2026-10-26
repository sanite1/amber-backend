import { Request, Response, NextFunction } from "express";
import ApiResponse from "../errors/apiResponse";
import ApiError from "../errors/apiError";
import {
  allowBookingCardEvent,
  hasMetricsKey,
  parseBookingCardEvent,
  recordBookingCardEvent,
  summariseBookingCard,
} from "../services/bookingCardMetrics.service";

const MAX_DAYS = 366;
const DEFAULT_DAYS = 30;

// POST /api/metrics/booking-card
//
// Public. The website's booking card sends {event, from, course, people} with
// navigator.sendBeacon (a text/plain body). Answers 204 with no body whatever
// happens, so the beacon never waits and nothing is revealed to a prober;
// only a valid event within the rate limits is counted.
export const recordBookingCardController = async (
  req: Request,
  res: Response,
) => {
  try {
    const event = parseBookingCardEvent(req.body);
    if (event && (await allowBookingCardEvent(req))) {
      await recordBookingCardEvent(event);
    }
  } catch (error) {
    console.error(
      "booking-card count failed:",
      error instanceof Error ? error.message : error,
    );
  }
  return res.status(204).end();
};

// GET /api/metrics/booking-card/summary?days=30
//
// Internal. Needs the header x-amber-metrics-key matching METRICS_READ_KEY.
// Returns totals by event, course, page and (for submits) team size over the
// last N days, today included, in Europe/London dates.
export const getBookingCardSummaryController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!hasMetricsKey(req.headers["x-amber-metrics-key"])) {
      return next(new ApiError(401, "Unauthorized"));
    }
    const raw = req.query.days;
    let days = DEFAULT_DAYS;
    if (raw !== undefined) {
      if (!/^\d{1,3}$/.test(String(raw))) {
        return next(new ApiError(400, "days must be a whole number."));
      }
      days = Math.min(Math.max(Number(raw), 1), MAX_DAYS);
    }
    const summary = await summariseBookingCard(days);
    res.set("Cache-Control", "no-store");
    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "Booking card summary fetched successfully.",
          summary,
        ),
      );
  } catch (error) {
    next(error);
  }
};
