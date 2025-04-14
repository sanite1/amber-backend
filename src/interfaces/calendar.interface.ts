import IUser from "../models/User";

export interface CalendarEventDetails {
  student: any;
  summary: string;
  description: string;
  startTime: string; // ISO string
  endTime: string; // ISO string
}
