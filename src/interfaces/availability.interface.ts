import { Schema } from "mongoose";

export interface TimeSlot {
  start: string; // Format: "HH:mm"
  end: string; // Format: "HH:mm"
}

export interface WeeklyAvailability {
  Monday?: { start: string; end: string }[];
  Tuesday?: { start: string; end: string }[];
  Wednesday?: { start: string; end: string }[];
  Thursday?: { start: string; end: string }[];
  Friday?: { start: string; end: string }[];
  Saturday?: { start: string; end: string }[];
  Sunday?: { start: string; end: string }[];

  // 🔥 Add this to allow indexing dynamically
  [key: string]: { start: string; end: string }[] | undefined;
}

export interface ITutorAvailability {
  tutorId: Schema.Types.ObjectId;
  timezone: string;
  weeklyAvailability: WeeklyAvailability;
}
