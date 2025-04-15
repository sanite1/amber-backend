import cron from "node-cron";
import { connectDb } from "../config/db";
import { autoReactivateStudents } from "../services/admin.service";

(async () => {
  await connectDb();

  // Run the task every minute
  cron.schedule("* * * * *", async () => {
    try {
      await autoReactivateStudents();
    } catch (error) {
      console.error("Error reactivating students:", error);
    }
  });
})();
