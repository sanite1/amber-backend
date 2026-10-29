import { Schema, model } from "mongoose";

// Daily counts of booking-card use on the website: how many visits started
// using the card ("start") and how many pressed "Book training" ("submit"),
// per page and per choice. Aggregate counters only: one document per
// combination per day, raised with an upsert and $inc. Deliberately nothing
// about the visitor is stored: no IP address, user agent, cookie or any other
// identifier, so the count needs no consent and works without cookies.
const BookingCardCountSchema = new Schema({
  // YYYY-MM-DD in Europe/London.
  day: { type: String, required: true },
  // "start" or "submit".
  event: { type: String, required: true },
  // The page the card sits on, e.g. "home" or "area-enfield".
  from: { type: String, required: true },
  // "efaw", "faw", "faw_requal" or "bls".
  course: { type: String, required: true },
  // "1-4", "5-8", "9-12", "13+", or "" for a start.
  people: { type: String, default: "" },
  count: { type: Number, default: 0 },
});

BookingCardCountSchema.index(
  { day: 1, event: 1, from: 1, course: 1, people: 1 },
  { unique: true },
);

const BookingCardCount = model("BookingCardCount", BookingCardCountSchema);

export default BookingCardCount;
