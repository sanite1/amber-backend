import { Request, Response } from "express";
import {
  allowBookingCardEvent,
  parseBookingCardEvent,
  recordBookingCardEvent,
} from "../services/bookingCardMetrics.service";
import {
  allowContactClick,
  parseContactClick,
  recordContactClick,
} from "../services/contactClickMetrics.service";

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

// POST /api/metrics/contact-click
//
// Public. The website sends {kind, channel, landing, from} with
// navigator.sendBeacon when a visitor clicks the support@ email link (or a
// phone link). Answers 204 with no body whatever happens; only a valid click
// within the rate limits is saved, at minute resolution, with nothing about
// the visitor.
export const recordContactClickController = async (
  req: Request,
  res: Response,
) => {
  try {
    const click = parseContactClick(req.body);
    if (click && (await allowContactClick(req))) {
      await recordContactClick(click);
    }
  } catch (error) {
    console.error(
      "contact-click record failed:",
      error instanceof Error ? error.message : error,
    );
  }
  return res.status(204).end();
};
