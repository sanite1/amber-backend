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
  locationPreference: "on-site" | "online";
  preferredDates: Date[];
  paymentStatus?: "pending" | "paid";
  status?: "pending" | "approved";
  createdAt?: Date;
  updatedAt?: Date;
}
