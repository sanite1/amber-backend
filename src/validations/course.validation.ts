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

    // Location preference enum updated
    locationPreference: Joi.string().valid("on-site", "physical").required(),

    preferredDates: Joi.array().items(Joi.date()).min(1).required(),
    // notes: Joi.string().allow("").optional(),
    // isGdprConsented: Joi.boolean().valid(true).required(),
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

export const createCourseValidation = () => {
  return validate(
    createCourseBookingSchema,
    { context: true },
    { abortEarly: false },
  );
};

export const bookingApprovalValidation = () => {
  return validate(
    bookingApprovalSchema,
    { context: true },
    { abortEarly: false },
  );
};
