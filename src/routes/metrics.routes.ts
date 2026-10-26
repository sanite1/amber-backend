import express from "express";
import {
  getBookingCardSummaryController,
  recordBookingCardController,
} from "../controllers/metrics.controller";

const router = express.Router();

// navigator.sendBeacon sends its JSON as text/plain (a "simple" request, so no
// CORS preflight). The app-wide JSON parser skips that type, so read it as
// text here; the controller parses it. Tiny limit: a real body is under 100
// bytes. A body the parser refuses (too large, bad encoding) gets the same
// silent 204 as any other invalid event.
const readText = express.text({ type: "text/plain", limit: "2kb" });
const beaconText: express.RequestHandler = (req, res, next) =>
  readText(req, res, (err?: unknown) => (err ? res.status(204).end() : next()));

// POST /api/metrics/booking-card  -> count a booking-card start or submit
router.post("/booking-card", beaconText, recordBookingCardController);

// GET /api/metrics/booking-card/summary?days=30  -> totals (secret header)
router.get("/booking-card/summary", getBookingCardSummaryController);

export default router;
