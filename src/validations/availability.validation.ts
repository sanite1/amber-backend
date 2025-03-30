import { Joi, validate } from "express-validation";
import { Types } from "mongoose";

const timeSchema = Joi.object({
  start: Joi.string()
    .pattern(/^([01]\d|2[0-3]):([0-5]\d)$/) // Matches HH:mm format (24-hour)
    .required(),
  end: Joi.string()
    .pattern(/^([01]\d|2[0-3]):([0-5]\d)$/) // Matches HH:mm format (24-hour)
    .required(),
});

const weeklyAvailabilitySchema = Joi.object({
  Monday: Joi.array().items(timeSchema).default([]),
  Tuesday: Joi.array().items(timeSchema).default([]),
  Wednesday: Joi.array().items(timeSchema).default([]),
  Thursday: Joi.array().items(timeSchema).default([]),
  Friday: Joi.array().items(timeSchema).default([]),
  Saturday: Joi.array().items(timeSchema).default([]),
  Sunday: Joi.array().items(timeSchema).default([]),
});

const createAvailabilitySchema = {
  body: Joi.object({
    tutorId: Joi.string()
      .custom((value, helpers) => {
        if (!Types.ObjectId.isValid(value)) {
          return helpers.error("any.invalid");
        }
        return value;
      }, "ObjectId validation")
      .required(),
    timezone: Joi.string().required(),
    weeklyAvailability: weeklyAvailabilitySchema.required(),
  }),
};

const getAvailabilitySchema = {
  params: Joi.object({
    id: Joi.string()
      .custom((value, helpers) => {
        if (!Types.ObjectId.isValid(value)) {
          return helpers.error("any.invalid");
        }
        return value;
      }, "ObjectId validation")
      .required(),
  }),
};

const updateAvailabilitySchema = {
  params: Joi.object({
    id: Joi.string()
      .custom((value, helpers) => {
        if (!Types.ObjectId.isValid(value)) {
          return helpers.error("any.invalid");
        }
        return value;
      }, "ObjectId validation")
      .required(),
  }),
  body: Joi.object({
    timezone: Joi.string().required(),
    weeklyAvailability: weeklyAvailabilitySchema.required(),
  }),
};

export const validateCreateTutorAvailability = () => {
  return validate(
    createAvailabilitySchema,
    { context: true },
    { abortEarly: false },
  );
};

export const validateGetTutorAvailability = () => {
  return validate(
    getAvailabilitySchema,
    { context: true },
    { abortEarly: false },
  );
};

export const validateUpdateTutorAvailability = () => {
  return validate(
    updateAvailabilitySchema,
    { context: true },
    { abortEarly: false },
  );
};
