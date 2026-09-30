import { Schema, model } from "mongoose";

// One document per form submission per key (client IP or email address).
// MongoDB's TTL index deletes each hit after an hour, so counting the hits
// for a key gives a rolling one-hour window that works on serverless hosting,
// where in-memory counters do not survive between requests.
const RateLimitHitSchema = new Schema({
  key: { type: String, required: true, index: true },
  createdAt: { type: Date, default: Date.now, expires: 3600 },
});

const RateLimitHit = model("RateLimitHit", RateLimitHitSchema);

export default RateLimitHit;
