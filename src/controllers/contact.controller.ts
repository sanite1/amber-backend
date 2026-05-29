import { Request, Response, NextFunction } from "express";
import ApiResponse from "../errors/apiResponse";
import ApiError from "../errors/apiError";
import { sendEnquiryMail } from "../services/nodemailer/mail.service";

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
