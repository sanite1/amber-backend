import { Schema, Document, model } from "mongoose";
import { INotification } from "../interfaces/notification.interface";

const NotificationSchema = new Schema<INotification>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "user", required: true },
    message: { type: String, required: true },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export const Notification = model<INotification>(
  "Notification",
  NotificationSchema,
);
