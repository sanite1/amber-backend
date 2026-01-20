import express from "express";
import {
  createCourseBookingController,
  getAllBookedDatesController,
} from "../controllers/course.controller";
import {
  isAdmin,
  isAuthenticated,
} from "../middlewares/authenticatedMiddleWare";
import { createCourseValidation } from "../validations/course.validation";
import { approveCourseBookingController } from "../controllers/course.controller";

const router = express.Router();

router.post("/book", createCourseValidation, createCourseBookingController);

router.get("/bookings/dates", getAllBookedDatesController);

router.post("/bookings/approve", approveCourseBookingController);

export default router;
