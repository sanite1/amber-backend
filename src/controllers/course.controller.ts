import { Request, Response, NextFunction } from "express";
import {
  createCourseBookingService,
  approveCourseBookingService,
  getAllBookedDatesService,
} from "../services/courses.service";
import ApiResponse from "../errors/apiResponse";
import ApiError from "../errors/apiError";

// Create Course Booking
// Create Course Booking
export const createCourseBookingController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const data = req.body;
    const response: ApiResponse = await createCourseBookingService(data);
    return res.status(response.statusCode).json(response);
  } catch (error) {
    if (error instanceof ApiError) {
      return res.status(error.statusCode).json({
        status: error.statusCode,
        message: error.message,
      });
    }
    console.error("❗ Failed to create course booking:", error);
    return next(new ApiError(500, "Failed to create course booking"));
  }
};

// Approve Course Booking
export const approveCourseBookingController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const data = req.body;
    const approvedBooking = await approveCourseBookingService(data);
    return res
      .status(200)
      .json(new ApiResponse(200, "Lesson booking approved", approvedBooking));
  } catch (error) {
    if (error instanceof ApiError) {
      return res.status(error.statusCode).json({
        status: error.statusCode,
        message: error.message,
      });
    }

    console.error("❗ Failed to approve course booking:", error);
    return next(new ApiError(500, "Failed to approve course booking"));
  }
};

export const getAllBookedDatesController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const bookingDates = await getAllBookedDatesService();
    return res
      .status(200)
      .json(new ApiResponse(200, "Booking dates fetched", bookingDates));
  } catch (error) {
    if (error instanceof ApiError) {
      return res.status(error.statusCode).json({
        status: error.statusCode,
        message: error.message,
      });
    }

    console.error("❗ Failed to fetch booking dates:", error);
    return next(new ApiError(500, "Failed to fetch booking dates"));
  }
};
