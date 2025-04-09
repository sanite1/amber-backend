import { NextFunction, Request, Response } from "express";
import ApiError from "../errors/apiError";
import TutorAvailability from "../models/Availability";
import {
  createTutorAvailabilityService,
  getTutorAvailabilityService,
  updateTutorAvailabilityService,
} from "../services/availability.service";
import { IdParam } from "../interfaces/helper.interface";
import ApiResponse from "../errors/apiResponse";

export const createAvailability = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { tutorId } = req.body;

    // Check if tutor already has availability set
    const existingAvailability = await TutorAvailability.findOne({ tutorId });

    if (existingAvailability) {
      throw new ApiError(
        400,
        "Availability already exists for this tutor. Please update it instead.",
      );
    }

    // Call the service to create availability
    const availability = await createTutorAvailabilityService(req.body);

    return res.status(201).json({
      message: "Tutor availability created successfully",
      data: availability,
    });
  } catch (error) {
    next(error);
  }
};

export const getAvailability = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id: tutorId } = req.params;

    // Check if tutor already has availability set
    const existingAvailability = await TutorAvailability.findOne({ tutorId });

    if (!existingAvailability) {
      throw new ApiResponse(201, "Availability does not exist for this tutor");
    }

    // Call the service to get availability
    const availability = await getTutorAvailabilityService(req.params as any);

    return res.status(200).json(availability);
  } catch (error) {
    next(error);
  }
};

export const updateAvailability = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id: tutorId } = req.params;

    // Check if tutor already has availability set
    const existingAvailability = await TutorAvailability.findOne({ tutorId });

    if (!existingAvailability) {
      throw new ApiError(400, "Availability does not exist for this tutor.");
    }

    // Call the service to update availability
    const updatedAvailability = await updateTutorAvailabilityService(
      tutorId,
      req.body,
    );

    return res.status(200).json({
      message: "Tutor availability updated successfully",
      data: updatedAvailability,
    });
  } catch (error) {
    next(error);
  }
};
