import { NextFunction, Request, Response } from "express";
import {
  sendMessageService,
  getMessagesService,
} from "../services/message.service";
import ApiResponse from "../errors/apiResponse";
import User from "../models/User";
import ApiError from "../errors/apiError";

export const sendStudentMessage = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { senderId, receiverId, content } = req.body;
    //check sender
    const sender = await User.findById(senderId);
    if (!sender) {
      throw new ApiError(404, "Sender not found");
    }
    if (sender.role !== "student") {
      throw new ApiError(403, "Only students can send messages");
    }

    //check receiver
    const receiver = await User.findById(receiverId);
    if (!receiver) {
      throw new ApiError(404, "Receiver not found");
    }

    //message
    const message = await sendMessageService(senderId, receiverId, content);
    res
      .status(201)
      .json(new ApiResponse(201, "Message sent successfully", message));
  } catch (error) {
    next(error);
  }
};

export const sendTutorMessage = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { senderId, receiverId, content } = req.body;

    const sender = await User.findById(senderId);
    if (!sender) {
      throw new ApiError(404, "Sender not found");
    }
    if (sender.role !== "tutor") {
      throw new ApiError(403, "Only tutor can send messages");
    }

    const receiver = await User.findById(receiverId);
    if (!receiver) {
      throw new ApiError(404, "Receiver not found");
    }

    const message = await sendMessageService(senderId, receiverId, content);

    return res
      .status(201)
      .json(new ApiResponse(201, "Message sent successfully", message));
  } catch (error) {
    next(error);
  }
};

export const getMessages = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { user1Id, user2Id } = req.query;
    const messages = await getMessagesService(
      user1Id as string,
      user2Id as string,
    );
    res.status(200).json(new ApiResponse(200, "Message retrieved", messages));
  } catch (error) {
    next(error);
  }
};
