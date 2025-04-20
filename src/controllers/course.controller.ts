import { Request, Response, NextFunction } from "express";
import { createCourseBookingService } from "../services/courses.service";
import ApiResponse from "../errors/apiResponse";
import ApiError from "../errors/apiError";
import { approveCourseBookingService } from "../services/courses.service";

// export const approveBooking = async (req: Request, res: Response) => {
//     const { bookingId } = req.params;
//     const booking = await approveStaticCourseBookingService(bookingId);
//     return res.status(200).json(
//       new ApiResponse(200, "Booking approved successfully", booking)
//     );
//   });
// controllers/course.controller.ts

//Create Course
export const createCourseBookingController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const data = req.body;
    const response: ApiResponse = await createCourseBookingService(data);
    res.status(response.statusCode).json(response);
  } catch (error) {
    next(new ApiError(500, "Failed to create course booking"));
  }
};

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
    next(error);
  }
};
