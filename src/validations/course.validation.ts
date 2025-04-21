import { Request, Response, NextFunction } from "express";
import { Joi, validate } from "express-validation";
import { Types } from "mongoose";

// Schema for creating a course booking
const createCourseBookingSchema = {
  body: Joi.object({
    course: Joi.object({
      name: Joi.string().required(),
      duration: Joi.string().required(),
      mode: Joi.string().required(),
      certification: Joi.string().required(),
      price: Joi.string().required(),
    }).required(),

    fullName: Joi.string().min(3).max(100).required(),
    email: Joi.string().email().required(),
    phone: Joi.string().min(7).max(20).required(),
    organizationName: Joi.string().allow("").optional(),
    numberOfParticipants: Joi.number().min(1).max(50).required(),
    locationPreference: Joi.string().valid("on-site", "physical").required(),
    preferredDates: Joi.array()
      .items(
        Joi.string()
          .isoDate()
          .message("Each preferred date must be a valid ISO date"),
      )
      .min(1)
      .required(),
  }),
};

const bookingApprovalSchema = {
  body: Joi.object({
    course: Joi.object({
      name: Joi.string().required(),
      duration: Joi.string().required(),
      mode: Joi.string().required(),
      certification: Joi.string().required(),
      price: Joi.string().required(),
    }).required(),

    fullName: Joi.string().min(3).max(100).required(),
    email: Joi.string().email().required(),
    phone: Joi.string().min(7).max(20).required(),
    organizationName: Joi.string().allow("").optional(),
    numberOfParticipants: Joi.number().min(1).max(50).required(),
    locationPreference: Joi.string().valid("on-site", "physical").required(),
    preferredDates: Joi.array().items(Joi.date()).min(1).required(),
  }),
};

export const createCourseValidation = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { error: validationError } = createCourseBookingSchema.body.validate(
    req.body,
    {
      convert: true,
      abortEarly: false,
    },
  );

  if (validationError) {
    console.error("❌ Joi validation error:", validationError.details);
    return res.status(400).json({
      message: "Validation failed",
      details: validationError.details.map((err) => err.message),
    });
  }

  next();
};

export const bookingApprovalValidation = () => {
  return validate(
    bookingApprovalSchema,
    { context: true },
    { abortEarly: false },
  );
};
