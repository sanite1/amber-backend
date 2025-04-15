import { Request, Response, NextFunction } from "express";
import {
  createNotificationService,
  getNotificationsService,
  markNotificationAsReadService,
  deleteNotificationService,
} from "../services/notification.service";
import ApiResponse from "../errors/apiResponse";

//Create a new notification
export const createNotification = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { userId, type, message, lessonId, assignmentId, eventId } = req.body;
    const notification = await createNotificationService(req.body);
    return res
      .status(201)
      .json(
        new ApiResponse(201, "Notification created successfully", notification),
      );
  } catch (error) {
    next(error);
  }
};

//Get all notification for a user
export const getNotifications = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    //check if user can be found (Not Done)
    const notification = await getNotificationsService(req.params.userId);

    return res
      .status(200)
      .json(new ApiResponse(200, "Notification retrieved", notification));
  } catch (error) {
    next(error);
  }
};

//Mark a notification as read
export const markNotificationAsRead = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  //check if the user is found
  try {
    const updatedNotification = await markNotificationAsReadService(
      req.params.notificationId,
      req.body,
    );

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "Notification marked as read",
          updatedNotification,
        ),
      );
  } catch (error) {
    next(error);
  }
};

//Delete a notification
export const deleteNotification = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    await deleteNotificationService(req.params.notificationId, req.body);
    return res.status(200).json(new ApiResponse(200, "Notification deleted"));
  } catch (error) {
    next(error);
  }
};
