import mongoose, { Schema, Model } from "mongoose";
import { ILesson } from "../interfaces/lesson.interface";

const LessonSchema: Schema<ILesson> = new Schema(
  {
    tutorId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    studentId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    date: { type: Date, required: true },
    duration: { type: String, required: true },
    status: {
      type: String,
      enum: ["scheduled", "completed", "cancelled", "pending_payment"],
      default: "pending_payment",
    },
    price: { type: Number, required: true },
  },
  { timestamps: true }, // Automatically adds createdAt and updatedAt fields
);

const Lesson: Model<ILesson> = mongoose.model<ILesson>("Lesson", LessonSchema);

export default Lesson;
