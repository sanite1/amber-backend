import { Joi, validate } from "express-validation";
import { Types } from "mongoose";

const createLessonSchema = {
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
    date: Joi.date().required(),
    duration: Joi.number().required(),
    status: Joi.string().required(),
    price: Joi.number().required(),
  }),
};

const getLessonSchema = {
  params: Joi.object({
    lessonId: Joi.string()
      .custom((value, helpers) => {
        if (!Types.ObjectId.isValid(value)) {
          return helpers.error("any.invalid");
        }
        return value;
      }, "ObjectId validation")
      .required(),
  }),
};

const updateLessonSchema = {
  params: Joi.object({
    lessonId: Joi.string()
      .custom((value, helpers) => {
        if (!Types.ObjectId.isValid(value)) {
          return helpers.error("any.invalid");
        }
        return value;
      }, "ObjectId validation")
      .required(),
  }),
  body: Joi.object({
    date: Joi.date().optional(),
    duration: Joi.string().optional(),
    status: Joi.string().optional(),
    price: Joi.number().optional(),
  }).min(1), // Ensure at least one field is updated
};

const deleteLessonSchema = {
  params: Joi.object({
    lessonId: Joi.string()
      .custom((value, helpers) => {
        if (!Types.ObjectId.isValid(value)) {
          return helpers.error("any.invalid");
        }
        return value;
      }, "ObjectId validation")
      .required(),
  }),
};

const getTutorLessonsSchema = {
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

const getStudentLessonsSchema = {
  params: Joi.object({
    studentId: Joi.string()
      .custom((value, helpers) => {
        if (!Types.ObjectId.isValid(value)) {
          return helpers.error("any.invalid");
        }
        return value;
      }, "ObjectId validation")
      .required(),
  }),
};

const updateLessonStatusSchema = {
  params: Joi.object({
    lessonId: Joi.string()
      .custom((value, helpers) => {
        if (!Types.ObjectId.isValid(value)) {
          return helpers.error("any.invalid");
        }
        return value;
      }, "ObjectId validation")
      .required(),
  }),
  body: Joi.object({
    status: Joi.string()
      .valid("scheduled", "completed", "cancelled")
      .required(),
  }),
};

export const validateCreateLesson = () => {
  return validate(createLessonSchema, { context: true }, { abortEarly: false });
};

export const validateGetLesson = () => {
  return validate(getLessonSchema, { context: true }, { abortEarly: false });
};

export const validateUpdateLesson = () => {
  return validate(updateLessonSchema, { context: true }, { abortEarly: false });
};

export const validateDeleteLesson = () => {
  return validate(deleteLessonSchema, { context: true }, { abortEarly: false });
};

export const validateGetTutorLessons = () => {
  return validate(
    getTutorLessonsSchema,
    { context: true },
    { abortEarly: false },
  );
};

export const validateGetStudentLessons = () => {
  return validate(
    getStudentLessonsSchema,
    { context: true },
    { abortEarly: false },
  );
};

export const validateUpdateLessonStatus = () => {
  return validate(
    updateLessonStatusSchema,
    { context: true },
    { abortEarly: false },
  );
};
