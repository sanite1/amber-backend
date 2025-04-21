import express from "express";
import { createCourseBookingController } from "../controllers/course.controller";
import {
  isAdmin,
  isAuthenticated,
} from "../middlewares/authenticatedMiddleWare";
import { createCourseValidation } from "../validations/course.validation";
import { approveCourseBookingController } from "../controllers/course.controller";

const router = express.Router();

router.post(
  "/book",
  //isAuthenticated,
  createCourseValidation,
  createCourseBookingController,
);

router.post(
  "/bookings/approve/",
  isAuthenticated,
  //IsAdmin,
  approveCourseBookingController,
);

export default router;
