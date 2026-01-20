import { Types } from "mongoose";
import { ICourse } from "./course.interface";

export interface CourseBooking {
  _id?: Types.ObjectId;
  course: ICourse;
  fullName: string;
  email: string;
  phone: string;
  organizationName?: string;
  numberOfParticipants: number;
  locationPreference: "your-premise" | "our-premise" | "online";
  preferredDates: { date: Date; time: string }[];
  paymentStatus?: "pending" | "paid";
  status?: "pending" | "approved";
  createdAt?: Date;
  updatedAt?: Date;
}
