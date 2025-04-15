import { Joi, validate } from "express-validation";
import { Types } from "mongoose";

const handleCallbackSchema = {
  query: Joi.object({
    code: Joi.string().required().messages({
      "string.base": "Code must be a string",
      "any.required": "Authorization code (code) is required",
    }),
  }),
  body: Joi.object({
    studentId: Joi.string()
      .custom((value, helpers) => {
        if (!Types.ObjectId.isValid(value)) {
          return helpers.error("any.invalid");
        }
        return value;
      }, "ObjectId validation")
      .required()
      .messages({
        "string.base": "Student ID must be a string",
        "any.invalid": "Invalid Student ID format",
        "any.required": "Student ID is required",
      }),
  }),
};

export const handleCallbackValidation = () => {
  return validate(
    handleCallbackSchema,
    { context: true },
    { abortEarly: false },
  );
};
