import { Message } from "../models/message";
import { IUser } from "../interfaces/user.interface";
import mongoose from "mongoose";
import ApiError from "../errors/apiError";
import { createNotificationService } from "./notification.service";
import User from "../models/User";
import { INotification } from "../interfaces/notification.interface";
export const sendMessageService = async (
  senderId: string,
  receiverId: string,
  content: string,
) => {
  if (
    !mongoose.Types.ObjectId.isValid(senderId) ||
    !mongoose.Types.ObjectId.isValid(receiverId)
  ) {
    throw new ApiError(400, "Invalid sender or receiver ID");
  }

  //Finder sender and receiver
  const sender = await User.findById(senderId);
  const receiver = await User.findById(receiverId);

  const message = new Message({ senderId, receiverId, content });
  await message.save();
  const notificationMessage = `You have received a new message from ${sender?.lastname}`;
  createNotificationService({
    userId: new mongoose.Types.ObjectId(receiverId),
    type: "event",
    message: notificationMessage,
    isRead: false,
  });
  return message;
};

export const getMessagesService = async (user1Id: string, user2Id: string) => {
  if (
    !mongoose.Types.ObjectId.isValid(user1Id) ||
    !mongoose.Types.ObjectId.isValid(user2Id)
  ) {
    throw new ApiError(400, "Invalid user ID");
  }
  return await Message.find({
    $or: [
      { senderId: user1Id, receiverId: user2Id },
      { senderId: user2Id, receiverId: user1Id },
    ],
  }).sort({ createdAt: 1 });
};
