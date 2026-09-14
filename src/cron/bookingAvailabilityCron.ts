import cron from "node-cron";
import { connectDb } from "../config/db";
import { refreshUnavailableDates } from "../services/bookingAvailability.service";

// Poll the Google Calendar iCal feed every 15 minutes and cache the parsed
// set of unavailable dates (same node-cron pattern as the other cron files).
// In a long-lived process this is the whole freshness story; on Vercel
// serverless it only ticks while an instance happens to stay warm, which is
// why getUnavailableDates() also refreshes lazily when the cache is older
// than 15 minutes.
(async () => {
  if (!process.env.GOOGLE_CALENDAR_ICAL_URL) {
    console.warn(
      "bookingAvailabilityCron: GOOGLE_CALENDAR_ICAL_URL not set, cron not scheduled",
    );
    return;
  }

  await connectDb();

  cron.schedule("*/15 * * * *", async () => {
    try {
      await refreshUnavailableDates();
    } catch (error) {
      console.error(
        "bookingAvailabilityCron: refresh failed -",
        error instanceof Error ? error.message : error,
      );
    }
  });
})();
