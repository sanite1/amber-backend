import mongoose, { Schema, Document } from "mongoose";

export interface INotification extends Document {
  userId: mongoose.Types.ObjectId;
  type: "message" | "lesson" | "assignment" | "event" | "system";
  message: string;
  isRead: boolean;
  lessonId?: mongoose.Types.ObjectId;
  assignmentId?: mongoose.Types.ObjectId;
  eventId?: mongoose.Types.ObjectId;
  createdAt: Date;
}
