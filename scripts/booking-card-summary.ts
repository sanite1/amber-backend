// Booking-card totals, read straight from the database (no HTTP route exists
// for them). Uses MONGODB_URI from the private local .env.
// Usage: npx ts-node --transpile-only scripts/booking-card-summary.ts [days]
import dotenv from "dotenv";
dotenv.config();
import mongoose from "mongoose";
import { summariseBookingCard } from "../src/services/bookingCardMetrics.service";

const main = async () => {
  const days = Math.min(Math.max(Number(process.argv[2] ?? 30) || 30, 1), 366);
  if (!process.env.MONGODB_URI) throw new Error("MONGODB_URI is not set");
  await mongoose.connect(process.env.MONGODB_URI);
  try {
    console.log(JSON.stringify(await summariseBookingCard(days), null, 2));
  } finally {
    await mongoose.disconnect();
  }
};

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
