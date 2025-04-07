import { Joi, validate } from "express-validation";
import { Types } from "mongoose";

const sendMessageSchema = {
  body: Joi.object({
    senderId: Joi.string()
      .custom((value, helpers) => {
        if (!Types.ObjectId.isValid(value)) {
          return helpers.error("any.invalid");
        }
        return value;
      }, "ObjectId validation")
      .required(),

    receiverId: Joi.string()
      .custom((value, helpers) => {
        if (!Types.ObjectId.isValid(value)) {
          return helpers.error("any.invalid");
        }
        return value;
      }, "ObjectId validation")
      .required(),

    content: Joi.string().trim().required().messages({
      "string.empty": "Message content is required",
    }),
  }),
};

const getMessageSchema = {
  query: Joi.object({
    user1Id: Joi.string()
      .custom((value, helpers) => {
        if (!Types.ObjectId.isValid(value)) {
          return helpers.error("any.invalid");
        }
        return value;
      }, "ObjectId validation")
      .required(),
    user2Id: Joi.string()
      .custom((value, helpers) => {
        if (!Types.ObjectId.isValid(value)) {
          return helpers.error("any.invalid");
        }
        return value;
      }, "ObjectId validation")
      .required(),
  }),
};

export const sendMessageValidation = () => {
  return validate(sendMessageSchema, { context: true }, { abortEarly: false });
};

export const getMessageValidation = () => {
  return validate(getMessageSchema, { context: true }, { abortEarly: false });
};
