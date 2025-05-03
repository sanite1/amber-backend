import { Request, Response, NextFunction } from "express";
import { Joi, validate } from "express-validation";

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
    locationPreference: Joi.string()
      .valid("your-premise", "our-premise", "online")
      .required(),

    address: Joi.alternatives().conditional("locationPreference", {
      is: "your-premise",
      then: Joi.object({
        street: Joi.string().required().messages({
          "any.required": "Street is required for your premise bookings.",
        }),
        city: Joi.string().required().messages({
          "any.required": "City is required for your premise bookings.",
        }),
        state: Joi.string().required().messages({
          "any.required": "State is required for your premise bookings.",
        }),
      })
        .required()
        .messages({
          "any.required": "Address is required for your premise bookings.",
        }),
      otherwise: Joi.forbidden().messages({
        "any.unknown": "Address should not be provided for online bookings.",
      }),
    }),

    gdprConsent: Joi.boolean().valid(true).required().messages({
      "any.only": "You must consent to data processing to proceed.",
    }),

    preferredDates: Joi.array()
      .items(
        Joi.string().isoDate().messages({
          "string.isoDate": "Each preferred date must be a valid ISO date",
        }),
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
    locationPreference: Joi.string()
      .valid("your-premise", "our-premise", "online")
      .required(),

    address: Joi.alternatives().conditional("locationPreference", {
      is: "your-premise",
      then: Joi.object({
        street: Joi.string().required().messages({
          "any.required": "Street is required for your premise bookings.",
        }),
        city: Joi.string().required().messages({
          "any.required": "City is required for your premise bookings.",
        }),
        state: Joi.string().required().messages({
          "any.required": "State is required for your premise bookings.",
        }),
      })
        .required()
        .messages({
          "any.required": "Address is required for your premise bookings.",
        }),
      otherwise: Joi.forbidden().messages({
        "any.unknown": "Address should not be provided for online bookings.",
      }),
    }),

    gdprConsent: Joi.boolean().valid(true).default(true).required().messages({
      "any.only": "You must consent to data processing to proceed.",
    }),

    preferredDates: Joi.array().items(Joi.date()).min(1).required(),
  }),
};

// Middleware for validating course creation
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

// Middleware for validating booking approval
export const bookingApprovalValidation = () => {
  return validate(
    bookingApprovalSchema,
    { context: true },
    { abortEarly: false },
  );
};
