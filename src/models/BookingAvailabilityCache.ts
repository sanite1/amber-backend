import { Schema, model } from "mongoose";

// Cached set of dates the Google Calendar iCal feed marks as busy, so the
// public booking-availability endpoint never has to touch the (secret) feed
// on the request path. One document per cache key. Stored in MongoDB rather
// than process memory because the backend runs as Vercel serverless
// functions: instances are ephemeral and there can be several at once.
const BookingAvailabilityCacheSchema = new Schema({
  key: { type: String, required: true, unique: true },
  // Plain YYYY-MM-DD strings. Deliberately nothing else: no titles, no
  // attendees, no event metadata of any kind is ever persisted here.
  dates: { type: [String], default: [] },
  fetchedAt: { type: Date, required: true },
});

const BookingAvailabilityCache = model(
  "BookingAvailabilityCache",
  BookingAvailabilityCacheSchema,
);

export default BookingAvailabilityCache;
