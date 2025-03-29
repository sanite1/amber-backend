import { Router } from "express";
import {
  getNotifications,
  markNotificationAsRead,
  deleteNotification,
  createNotification,
} from "../controllers/notification.controller";
import {
  createNotificationValidation,
  markNotificationValidation,
  deleteNotificationValidation,
  getNotificationValidation,
} from "../validations/notification.validation";
import { isAuthenticated } from "../middlewares/authenticatedMiddleWare";

const router = Router();

//Create a new notification
router.post(
  "/",
  isAuthenticated,
  createNotificationValidation(),
  createNotification,
);

//Get all the notification for the authenticatied
router.get(
  "/:userId",
  isAuthenticated,
  getNotificationValidation(),
  getNotifications,
);

//Mark a specific notification as read
router.patch(
  "/:notificationId",
  isAuthenticated,
  markNotificationValidation(),
  markNotificationAsRead,
);

//Delete a specific notification
router.delete(
  "/:notificationId",
  isAuthenticated,
  deleteNotificationValidation(),
  deleteNotification,
);

export default router;
