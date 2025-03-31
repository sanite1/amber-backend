import { Types } from "mongoose";

export interface ILesson {
  tutorId: Types.ObjectId | string;
  studentId: Types.ObjectId | string;
  date: Date;
  duration: string;
  status: "scheduled" | "completed" | "cancelled";
  price: number;
}

export interface IUpdateLesson {
  date: Date;
  duration: string;
  status: "scheduled" | "completed" | "cancelled";
  price: number;
}
