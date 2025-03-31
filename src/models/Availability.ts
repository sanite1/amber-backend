import { Schema, model } from "mongoose";
import { ITutorAvailability } from "../interfaces/availability.interface";

const timeSlotSchema = new Schema(
  {
    start: { type: String, required: true }, // Format: "HH:mm"
    end: { type: String, required: true }, // Format: "HH:mm"
  },
  { _id: false },
);

const weeklyAvailabilitySchema = new Schema(
  {
    Monday: { type: [timeSlotSchema], default: [] },
    Tuesday: { type: [timeSlotSchema], default: [] },
    Wednesday: { type: [timeSlotSchema], default: [] },
    Thursday: { type: [timeSlotSchema], default: [] },
    Friday: { type: [timeSlotSchema], default: [] },
    Saturday: { type: [timeSlotSchema], default: [] },
    Sunday: { type: [timeSlotSchema], default: [] },
  },
  { _id: false },
);

const timeForBookingSchema = new Schema(
  {
    dateStart: { type: Date, required: true },
    dateEnd: { type: Date, required: true },
    status: { type: String, required: true },
  },
  { _id: false },
);

const tutorAvailabilitySchema = new Schema(
  {
    tutorId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    timezone: { type: String, required: true },
    weeklyAvailability: { type: weeklyAvailabilitySchema, required: false },
    timesForBooking: { type: [timeForBookingSchema], default: [] }, // Stores computed 30-min slots
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

const TutorAvailability = model("TutorAvailability", tutorAvailabilitySchema);

export default TutorAvailability;
