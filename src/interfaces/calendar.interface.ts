export interface CalendarEventDetails {
  student: any;
  summary: string;
  description: string;
  startTime: string;
  endTime: string;
  recipientEmail: string;
  accessToken: string;
  attendees: { email: string }[];
  refreshToken?: string;
  expiryDate?: Date;
  reminderMinutes: number;
}
