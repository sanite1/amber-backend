import { Request, Response, NextFunction } from "express";
import ApiResponse from "../errors/apiResponse";
import ApiError from "../errors/apiError";
import {
  sendEnquiryMail,
  sendBookingEnquiryMail,
} from "../services/nodemailer/mail.service";

// Handle a B2B on-site training booking / quote request.
export const createBookingEnquiryController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const {
      companyName,
      contactName,
      email,
      phone,
      courseType,
      delegates,
      preferredDates,
      venueAddress,
      specialRequirements,
      source,
    } = req.body;

    if (!companyName || !contactName || !email || !courseType) {
      return next(
        new ApiError(
          400,
          "Please provide your company, contact name, email and course type.",
        ),
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return next(new ApiError(400, "Please provide a valid email address."));
    }

    await sendBookingEnquiryMail({
      companyName,
      contactName,
      email,
      phone,
      courseType,
      delegates,
      preferredDates,
      venueAddress,
      specialRequirements,
      source,
    });

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "Thank you. We will be in touch within 24 hours with your confirmation and invoice.",
        ),
      );
  } catch (error) {
    if (error instanceof ApiError) {
      return res
        .status(error.statusCode)
        .json({ status: error.statusCode, message: error.message });
    }
    console.error("❗ Failed to send booking request:", error);
    return next(
      new ApiError(500, "Failed to send booking request. Please try again."),
    );
  }
};

// Handle a website enquiry / contact form submission.
export const createEnquiryController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const {
      firstName,
      lastName,
      email,
      phone,
      message,
      courseInterest,
      source,
    } = req.body;

    if (!firstName || !email || !message) {
      return next(
        new ApiError(400, "Please provide your name, email and a message."),
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return next(new ApiError(400, "Please provide a valid email address."));
    }

    await sendEnquiryMail({
      firstName,
      lastName,
      email,
      phone,
      message,
      courseInterest,
      source,
    });

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "Thank you for your enquiry. We will be in touch shortly.",
        ),
      );
  } catch (error) {
    if (error instanceof ApiError) {
      return res
        .status(error.statusCode)
        .json({ status: error.statusCode, message: error.message });
    }
    console.error("❗ Failed to send enquiry:", error);
    return next(new ApiError(500, "Failed to send enquiry. Please try again."));
  }
};
