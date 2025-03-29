import { Notification } from "../models/notification";
import ApiError from "../errors/apiError";
import { INotification } from "../interfaces/notification.interface";
import { Types } from "mongoose";
import { createNotification } from "../controllers/notification.controller";
import User from "../models/User";

//Create a new notification
export const createNotificationService = async (data: INotification) => {
  const { userId, type, message, lessonId, assignmentId, eventId } = data;
  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(404, "User not found");
  }
  if (user.role !== "student" && user.role !== "tutor") {
    throw new ApiError(400, "Invalid user ID:User is not a student or tutor");
  }
  const notificationData: any = { userId, type, message, isRead: false };
  if (type === "lesson" && lessonId) {
    notificationData.lessonId = lessonId;
  } else if (type === "assignment" && assignmentId) {
    notificationData.assignmentId = assignmentId;
  } else if (type === "event" && eventId) {
    notificationData.eventId = eventId;
  }
  return await Notification.create(notificationData);
};

//Get all notification for a user.
export const getNotificationsService = async (userId: string) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(404, "User not found");
  }
  if (user.role != "student" && user.role != "tutor") {
    throw new ApiError(400, "Invalid user ID:User is not a student or tutor");
  }
  return await Notification.find({ userId }).sort({ createdAt: -1 });
};

//Mark a notification as read
export const markNotificationAsReadService = async (
  notificationId: string,
  data: any,
) => {
  if (!Types.ObjectId.isValid(notificationId)) {
    throw new ApiError(400, "Invalid notification ID");
  }
  // Fetch notification
  const notification = await Notification.findById(notificationId);
  if (!notification) {
    throw new ApiError(404, "Notification not found");
  }
  if (notification.userId.toString() !== data.userId) {
    throw new ApiError(403, "Not authorized to update this review");
  }
  // Update and save the notification
  notification.isRead = true;
  await notification.save();
  return notification;
};

//Delete a notification
export const deleteNotificationService = async (
  notificationId: string,
  data: any,
) => {
  if (!Types.ObjectId.isValid(notificationId)) {
    throw new ApiError(400, "Invalid notification ID");
  }

  const notification = await Notification.findById(notificationId);
  if (!notification) {
    throw new ApiError(404, "Notification not found");
  }

  if (notification.userId.toString() !== data.userId) {
    throw new ApiError(403, "Not authorized to delete this notification");
  }

  const deletedNotification = await Notification.findOneAndDelete({
    _id: notificationId,
    userId: data.userId,
  });

  if (!deletedNotification) {
    throw new ApiError(404, "Notification not found or already deleted");
  }
  return deletedNotification;
};
