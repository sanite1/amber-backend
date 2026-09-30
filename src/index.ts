import express from "express";
import dotenv from "dotenv";
dotenv.config();
import cors from "cors";
import { connectDb } from "./config/db";
import { globalErrorHandler } from "./middlewares/globalErrorHandler";
import ApiError from "./errors/apiError";
import contactRoutes from "./routes/contact.routes";
import bookingAvailabilityRoutes from "./routes/bookingAvailability.routes";
import "./cron/bookingAvailabilityCron";

const PORT = 4000;

const app = express();
app.disable("x-powered-by");

app.use(express.json());

const corsOption = {
  origin: "*",
  credentials: true,
};
app.use(cors(corsOption));

connectDb();

//Routes
// Only the live website routes are mounted. The retired tutoring platform's
// routes (users, admin, courses, payment, lessons, etc.) stay in the repo but
// are not served.
app.use("/api/contact", contactRoutes);
app.use("/api/booking-availability", bookingAvailabilityRoutes);

app.listen(PORT, () => {
  console.log("Server Listening on port 4000...");
});
app.all("*", (req, _res, next) => {
  next(new ApiError(404, `Can't find ${req.originalUrl} on the server!`));
});
app.use(globalErrorHandler);
