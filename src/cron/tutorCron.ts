import cron from "node-cron";
import { connectDb } from "../config/db";
import { autoReactivateTutors } from "../services/admin.service";

(async () => {
  await connectDb();
  console.log("Database connected, starting cron job...");

  // Run the task every minute
  cron.schedule("* * * * *", async () => {
    try {
      console.log("Running scheduled student reactivation check...");
      await autoReactivateTutors();
    } catch (error) {
      console.error("Error reactivating tutors:", error);
    }
  });

  console.log("Cron job scheduled to run every minute for tutors.");
})();
