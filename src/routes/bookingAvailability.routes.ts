import express from "express";
import { getUnavailableDatesController } from "../controllers/bookingAvailability.controller";

const router = express.Router();

// GET /api/booking-availability/unavailable-dates -> dates the booking form
// should disable (read-only reflection of the Google Calendar iCal feed).
// Named "booking-availability" to stay clear of the legacy tutor
// /api/availability routes.
router.get("/unavailable-dates", getUnavailableDatesController);

export default router;
