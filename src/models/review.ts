import { Schema, model, Types } from "mongoose";
import { IReview } from "../interfaces/review.interface";

const reviewSchema = new Schema<IReview>(
  {
    tutorId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    studentId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, trim: true }, // Optional
  },
  {
    timestamps: true,
    toJSON: {
      transform(doc, ret) {
        delete ret.__v;
      },
    },
  },
);

const Review = model<IReview>("Review", reviewSchema);
export default Review;
