import express from "express";
import {
  recordBookingCardController,
  recordContactClickController,
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

// POST /api/metrics/contact-click  -> save a click on the email or phone link
router.post("/contact-click", beaconText, recordContactClickController);

// Write-only: there is deliberately no read route. Totals and clicks are read
// straight from the database by internal tools (scripts/booking-card-summary.ts
// and scripts/contact-click-summary.ts).

export default router;
