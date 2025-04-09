import cron from "node-cron";
import { connectDb } from "../config/db";
import { autoReactivateStudents } from "../services/admin.service";

(async () => {
  await connectDb();
  console.log("Database connected, starting cron job...");

  // Run the task every minute
  cron.schedule("* * * * *", async () => {
    try {
      console.log("Running scheduled student reactivation check...");
      await autoReactivateStudents();
    } catch (error) {
      console.error("Error reactivating students:", error);
    }
  });

  console.log("Cron job scheduled to run every minute for students.");
})();
