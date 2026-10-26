import { Request, Response } from "express";
import {
  allowBookingCardEvent,
  parseBookingCardEvent,
  recordBookingCardEvent,
} from "../services/bookingCardMetrics.service";

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
