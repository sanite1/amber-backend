import express from "express";
import dotenv from "dotenv";
dotenv.config();
import cors from "cors";
import { connectDb } from "./config/db";
import { globalErrorHandler } from "./middlewares/globalErrorHandler";
import ApiError from "./errors/apiError";
import userRoutes from "./routes/user.routes";
import reviewRoutes from "./routes/reviews.routes";
import notificationRoutes from "./routes/notification.routes";
import availabilityRoutes from "./routes/availability.routes";
import lessonRoutes from "./routes/lesson.routes";
import messageRoutes from "./routes/message.routes";
import adminRoutes from "./routes/admin.routes";
import calendarRoutes from "./routes/calendar.routes";
import bookCourseRoutes from "./routes/course.routes";
import paymentRoutes from "./routes/payment.routes";
import "./cron/studentCron";
import "./cron/tutorCron";

const PORT = process.env.PORT || 4000;

const app = express();

app.use(express.json());
app.use(express.urlencoded({ limit: "10mb", extended: true }));

// Define allowed origins
const allowedOrigins = [
  "https://ambertraining.co.uk",
  "https://www.ambertraining.co.uk",
  "https://booking.ambertraining.co.uk",
  "http://localhost:3000",
  "http://localhost:5173",
  process.env.FRONTEND_URL,
].filter(Boolean); // Remove undefined values

const corsOptions = {
  origin: (origin: any, callback: any) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`CORS blocked request from origin: ${origin}`);
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  optionsSuccessStatus: 200,
  maxAge: 3600,
};

app.use(cors(corsOptions));

// Handle preflight requests
app.options("*", cors(corsOptions));

connectDb();

// Routes
app.use("/api/users", userRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/availability", availabilityRoutes);
app.use("/api/lessons", lessonRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/calendar", calendarRoutes);
app.use("/api/courses", bookCourseRoutes);
app.use("/api/payment", paymentRoutes);

app.listen(PORT, () => {
  console.log(`Server Listening on port ${PORT}...`);
});

app.all("*", (req, _res, next) => {
  next(new ApiError(404, `Can't find ${req.originalUrl} on the server!`));
});

app.use(globalErrorHandler);
