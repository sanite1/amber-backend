import { Request, Response, NextFunction } from "express";
import ApiResponse from "../errors/apiResponse";
import ApiError from "../errors/apiError";
import {
  availabilityRange,
  getUnavailableDates,
} from "../services/bookingAvailability.service";

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

// GET /api/booking-availability/unavailable-dates?from=YYYY-MM-DD&to=YYYY-MM-DD
//
// Public, read-only. Returns ONLY plain dates (never event titles, attendees,
// descriptions or any other calendar metadata) so the booking form can grey
// out days Joey is already committed to. from/to are optional and are clamped
// to [today, today + 6 months] in Europe/London.
export const getUnavailableDatesController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { from, to } = req.query;

    if (
      (from !== undefined && !ISO_DATE.test(String(from))) ||
      (to !== undefined && !ISO_DATE.test(String(to)))
    ) {
      return next(
        new ApiError(400, "from and to must be dates in YYYY-MM-DD format."),
      );
    }

    const range = availabilityRange();
    const min = range.from.format("YYYY-MM-DD");
    const max = range.to.format("YYYY-MM-DD");
    // YYYY-MM-DD strings compare correctly as plain strings.
    const fromYmd = from && String(from) > min ? String(from) : min;
    const toYmd = to && String(to) < max ? String(to) : max;

    const { dates, updatedAt } = await getUnavailableDates();

    return res.status(200).json(
      new ApiResponse(200, "Unavailable dates fetched successfully.", {
        from: fromYmd,
        to: toYmd,
        dates: dates.filter((d) => d >= fromYmd && d <= toYmd),
        updatedAt,
      }),
    );
  } catch (error) {
    next(error);
  }
};
