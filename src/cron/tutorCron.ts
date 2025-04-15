import cron from "node-cron";
import { connectDb } from "../config/db";
import { autoReactivateTutors } from "../services/admin.service";

(async () => {
  await connectDb();

  // Run the task every minute
  cron.schedule("* * * * *", async () => {
    try {
      await autoReactivateTutors();
    } catch (error) {
      console.error("Error reactivating tutors:", error);
    }
  });
})();
