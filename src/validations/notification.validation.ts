import { Joi, validate } from "express-validation";
import { Types } from "mongoose";

const createNotificationSchema = {
  body: Joi.object({
    userId: Joi.string()
      .custom((value, helpers) => {
        if (!Types.ObjectId.isValid(value)) {
          return helpers.error("any.invalid");
        }
        return value;
      }, "ObjectId validation")
      .required(),
    type: Joi.string()
      .valid("message", "lesson", "assignment", "event", "system")
      .required(),
    message: Joi.string().trim().required(),
    lessonId: Joi.string()
      .custom((value, helpers) => {
        if (value && !Types.ObjectId.isValid(value)) {
          return helpers.error("any.invalid");
        }
        return value;
      }, "ObjectId validation")
      .optional(),
    assignmentId: Joi.string()
      .custom((value, helpers) => {
        if (value && !Types.ObjectId.isValid(value)) {
          return helpers.error("any.invalid");
        }
        return value;
      }, "ObjectId validation")
      .optional(),
    eventId: Joi.string()
      .custom((value, helpers) => {
        if (value && !Types.ObjectId.isValid(value)) {
          return helpers.error("any.invalid");
        }
        return value;
      }, "ObjectId validation")
      .optional(),
    isRead: Joi.boolean().default(false),
  }),
};

const getNotificationSchema = {
  params: Joi.object({
    userId: Joi.string()
      .custom((value, helpers) => {
        if (!Types.ObjectId.isValid(value)) {
          return helpers.error("any.invalid");
        }
        return value;
      }, "ObjectId validation")
      .required(),
  }),
};

const markNotificationSchema = {
  body: Joi.object({
    userId: Joi.string()
      .custom((value, helpers) => {
        if (!Types.ObjectId.isValid(value)) {
          return helpers.error("any.invalid");
        }
        return value;
      }, "ObjectId validation")
      .required(),
  }),
  params: Joi.object({
    notificationId: Joi.string()
      .custom((value, helpers) => {
        if (!Types.ObjectId.isValid(value)) {
          return helpers.error("any.invalid");
        }
        return value;
      }, "ObjectId validation")
      .required(),
  }),
};

//**
const deleteNotificationSchema = {
  body: Joi.object({
    userId: Joi.string()
      .custom((value, helpers) => {
        if (!Types.ObjectId.isValid(value)) {
          return helpers.error("any.invalid");
        }
        return value;
      }, "ObjectId validation")
      .required(),
  }),
  params: Joi.object({
    notificationId: Joi.string()
      .custom((value, helpers) => {
        if (!Types.ObjectId.isValid(value)) {
          return helpers.error("any.invalid");
        }
        return value;
      }, "ObjectId validation")
      .required(),
  }),
};

export const createNotificationValidation = () => {
  return validate(
    createNotificationSchema,
    { context: true },
    { abortEarly: false },
  );
};

export const markNotificationValidation = () => {
  return validate(
    markNotificationSchema,
    { context: true },
    { abortEarly: false },
  );
};

export const deleteNotificationValidation = () => {
  return validate(
    deleteNotificationSchema,
    { context: true },
    { abortEarly: false },
  );
};

export const getNotificationValidation = () => {
  return validate(
    getNotificationSchema,
    { context: true },
    { abortEarly: false },
  );
};
