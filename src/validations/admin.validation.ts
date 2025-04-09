import { Joi, validate } from "express-validation";
import { Types } from "mongoose";

// Admin Registration Schema
const registerAdminSchema = {
  body: Joi.object({
    firstname: Joi.string().min(2).required(),
    lastname: Joi.string().required(),
    email: Joi.string().email().required(),
    phoneNumber: Joi.string().required(),
    password: Joi.string().min(6).required(), // Minimum length for security
    profilePicture: Joi.string().uri().optional(), // Must be a valid URL
    role: Joi.string().valid("admin", "tutor", "student").default("admin"),
  }),
};

// Admin Login Schema
const loginAdminSchema = {
  body: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
  }),
};

// Verify Admin Email Schema
const verifyAdminSchema = {
  params: Joi.object({
    id: Joi.string()
      .custom((value, helpers) => {
        if (!Types.ObjectId.isValid(value)) {
          return helpers.error("any.invalid");
        }
        return value;
      }, "ObjectId validation")
      .required(),
    token: Joi.string().required(),
  }),
};

// Reset Admin Password Schema
const resetAdminPasswordSchema = {
  params: Joi.object({
    id: Joi.string()
      .custom((value, helpers) => {
        if (!Types.ObjectId.isValid(value)) {
          return helpers.error("any.invalid");
        }
        return value;
      }, "ObjectId validation")
      .required(),
    token: Joi.string().required(),
  }),
  body: Joi.object({
    password: Joi.string().min(6).required(),
  }),
};

// Forgot Password Schema
const forgotAdminPasswordSchema = {
  body: Joi.object({
    email: Joi.string().email().required(),
  }),
};

// const updateAdminStatusSchema = {
//   body: Joi.object({
//     studentId: Joi.string()
//       .custom((value, helpers) => {
//         if (!Types.ObjectId.isValid(value)) {
//           return helpers.error("any.invalid");
//         }
//         return value;
//       }, "ObjectId validation")
//       .required(),
//     isActive: Joi.boolean().required(),
//   }),
// };

const getStudentsStatusSchema = {
  params: Joi.object({
    adminId: Joi.string()
      .custom((value, helpers) => {
        if (!Types.ObjectId.isValid(value)) {
          return helpers.error("any.invalid");
        }
        return value;
      }, "ObjectId validation")
      .required(),
  }),

  query: Joi.object({
    isActive: Joi.string().valid("true", "false").optional(),
    verified: Joi.string().valid("true", "false").optional(),
    startDate: Joi.date().iso().optional(),
    endDate: Joi.date().iso().optional(),
  }),
};

const updateTutorStatusSchema = {
  params: Joi.object({
    adminId: Joi.string()
      .custom((value, helpers) => {
        if (!Types.ObjectId.isValid(value)) {
          return helpers.error("any.invalid");
        }
        return value;
      }, "ObjectId validation")
      .required(),
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

const updateStudentStatusSchema = {
  params: Joi.object({
    adminId: Joi.string()
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
  }),
};

const getTutorsStatusSchema = {
  params: Joi.object({
    adminId: Joi.string()
      .custom((value, helpers) => {
        if (!Types.ObjectId.isValid(value)) {
          return helpers.error("any.invalid");
        }
        return value;
      }, "ObjectId validation")
      .required(),
  }),
  query: Joi.object({
    isActive: Joi.string().valid("true", "false").optional(),
    verified: Joi.string().valid("true", "false").optional(),
    startDate: Joi.date().iso().optional(),
    endDate: Joi.date().iso().optional(),
  }),
};

const definiteupdateStudentStatusSchema = {
  params: Joi.object({
    adminId: Joi.string()
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
  }),
  body: Joi.object({
    duration: Joi.number().integer().min(1).required().messages({
      "number.base": "Duration must be a number",
      "number.integer": "Duration must be an integer",
      "number.min": "Duration must be at least 1",
      "any.required": "Duration is required",
    }),
    unit: Joi.string()
      .valid("minutes", "hours", "days", "weeks", "months")
      .required()
      .messages({
        "any.only":
          "Unit must be one of minutes, hours, days, weeks, or months",
        "any.required": "Unit is required",
      }),
  }),
};

const definiteupdateTutorStatusSchema = {
  params: Joi.object({
    adminId: Joi.string()
      .custom((value, helpers) => {
        if (!Types.ObjectId.isValid(value)) {
          return helpers.error("any.invalid");
        }
        return value;
      }, "ObjectId validation")
      .required(),
    tutorId: Joi.string()
      .custom((value, helpers) => {
        if (!Types.ObjectId.isValid(value)) {
          return helpers.error("any.invalid");
        }
        return value;
      }, "ObjectId validation")
      .required(),
  }),
  body: Joi.object({
    duration: Joi.number().integer().min(1).required().messages({
      "number.base": "Duration must be a number",
      "number.integer": "Duration must be an integer",
      "number.min": "Duration must be at least 1",
      "any.required": "Duration is required",
    }),
    unit: Joi.string()
      .valid("minutes", "hours", "days", "weeks", "months")
      .required()
      .messages({
        "any.only":
          "Unit must be one of minutes, hours, days, weeks, or months",
        "any.required": "Unit is required",
      }),
  }),
};

// Export Validation Middleware
export const registerAdminValidation = () => {
  return validate(
    registerAdminSchema,
    { context: true },
    { abortEarly: false },
  );
};

export const loginAdminValidation = () => {
  return validate(loginAdminSchema, { context: true }, { abortEarly: false });
};

export const verifyAdminValidation = () => {
  return validate(verifyAdminSchema, { context: true }, { abortEarly: false });
};

export const resetAdminPasswordValidation = () => {
  return validate(
    resetAdminPasswordSchema,
    { context: true },
    { abortEarly: false },
  );
};

export const forgotAdminPasswordValidation = () => {
  return validate(
    forgotAdminPasswordSchema,
    { context: true },
    { abortEarly: false },
  );
};

// export const updateAdminStatusValidation = () => {
//   return validate(updateAdminStatusSchema, { context: true }, { abortEarly: false });
// };

export const getStudentsStatusValidation = () => {
  return validate(
    getStudentsStatusSchema,
    { context: true },
    { abortEarly: false },
  );
};

export const getTutorsStatusValidation = () => {
  return validate(
    getTutorsStatusSchema,
    { context: true },
    { abortEarly: false },
  );
};

export const updateTutorStatusValidation = () => {
  return validate(
    updateTutorStatusSchema,
    { context: true },
    { abortEarly: false },
  );
};

export const updateStudentStatusValidation = () => {
  return validate(
    updateStudentStatusSchema,
    { context: true },
    { abortEarly: false },
  );
};

export const definiteupdateStudentStatusValidation = () => {
  return validate(
    definiteupdateStudentStatusSchema,
    { context: true },
    { abortEarly: false },
  );
};

export const definiteupdateTutorStatusValidation = () => {
  return validate(
    definiteupdateTutorStatusSchema,
    { context: true },
    { abortEarly: false },
  );
};
