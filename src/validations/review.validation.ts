import { Joi, validate } from "express-validation";
import { Types } from "mongoose";

const createReviewSchema = {
  body: Joi.object({
    tutorId: Joi.string()
      .custom((value, helpers) => {
        if (!Types.ObjectId.isValid(value)) {
          return helpers.error("any.invalid");
        }
        return value;
      }, "ObjectId validation")
      .required(),
    studentId: Joi.string()
      .custom((value, helpers) => {
        if (!Types.ObjectId.isValid(value)) {
          return helpers.error("any.invalid");
        }
        return value;
      }, "ObjectId validation")
      .required(),
    rating: Joi.number().min(1).max(5).required(),
    comment: Joi.string().trim().optional(),
  }),
};

const getReviewsByTutorSchema = {
  params: Joi.object({
    tutorId: Joi.string()
      .custom((value, helpers) => {
        if (!Types.ObjectId.isValid(value)) {
          return helpers.error("any.invalid");
        }
        return value;
      }, "ObjectId validation")
      .required(),
  }),
};
const updateReviewSchema = {
  body: Joi.object({
    rating: Joi.number().min(1).max(5),
    comment: Joi.string().trim(),
    studentId: Joi.string()
      .custom((value, helpers) => {
        if (!Types.ObjectId.isValid(value)) {
          return helpers.error("any.invalid");
        }
        return value;
      }, "ObjectId validation")
      .required(),
  }),
  params: Joi.object({
    reviewId: Joi.string()
      .custom((value, helpers) => {
        if (!Types.ObjectId.isValid(value)) {
          return helpers.error("any.invalid");
        }
        return value;
      }, "ObjectId validation")
      .required(),
  }),
};

const deleteReviewSchema = {
  body: Joi.object({
    studentId: Joi.string()
      .custom((value, helpers) => {
        if (!Types.ObjectId.isValid(value)) {
          return helpers.error("any.invalid");
        }
        return value;
      }, "ObjectId validation")
      .required(),
  }),
  params: Joi.object({
    reviewId: Joi.string()
      .custom((value, helpers) => {
        if (!Types.ObjectId.isValid(value)) {
          return helpers.error("any.invalid");
        }
        return value;
      }, "ObjectId validation")
      .required(),
  }),
};

export const createReviewValidation = () => {
  return validate(createReviewSchema, { context: true }, { abortEarly: false });
};

export const updateReviewValidation = () => {
  return validate(updateReviewSchema, { context: true }, { abortEarly: false });
};

export const getReviewsByTutorValidation = () => {
  return validate(
    getReviewsByTutorSchema,
    { context: true },
    { abortEarly: false },
  );
};

export const deleteReviewValidation = () => {
  return validate(deleteReviewSchema, { context: true }, { abortEarly: false });
};
