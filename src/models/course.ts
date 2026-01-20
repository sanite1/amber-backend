import { Schema, model } from "mongoose";

const CourseBookingSchema = new Schema(
  {
    course: {
      name: { type: String, required: true },
      duration: { type: String, required: true },
      mode: { type: String, required: true },
      certification: { type: String, required: true },
      price: { type: String, required: true },
    },
    fullName: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    organizationName: { type: String },
    numberOfParticipants: { type: Number, required: true },
    locationPreference: {
      type: String,
      enum: ["your-premise", "our-premise", "online"],
      required: true,
    },
    preferredDates: [
      {
        date: { type: Date, required: true },
        time: { type: String, required: true }, // HH:MM format
      },
    ],
    paymentStatus: {
      type: String,
      enum: ["pending", "paid"],
      default: "paid",
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "approved",
    },
    address: {
      street: { type: String, default: "N/A" },
      city: { type: String, default: "N/A" },
      state: { type: String, default: "N/A" },
    },
    gdprConsent: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
);

const CourseBooking = model("CourseBooking", CourseBookingSchema);

export default CourseBooking;
