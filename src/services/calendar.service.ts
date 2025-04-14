// calendar.service.ts
import { google } from "googleapis";
import dotenv from "dotenv";
import UserModel from "../models/User";
import { IUser } from "../interfaces/user.interface";

dotenv.config();

export interface CalendarEventDetails {
  student: any;
  summary: string;
  description: string;
  startTime: string;
  endTime: string;
  recipientEmail: string;
  accessToken: string;
  attendees: { email: string }[];
  refreshToken?: string; // <-- add this
  expiryDate?: Date; // <-- and this
  reminderMinutes: number;
}

export const createCalendarEvent = async ({
  student,
  summary,
  description,
  startTime,
  endTime,
  attendees,
  recipientEmail,
  reminderMinutes = 15, //Try to check 15,60 minutes and 24 hrs
}: CalendarEventDetails) => {
  const oAuth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID!,
    process.env.GOOGLE_CLIENT_SECRET!,
    process.env.GOOGLE_REDIRECT_URL!,
  );

  oAuth2Client.setCredentials({
    access_token: student.googleAccessToken,
    refresh_token: student.googleRefreshToken,
    expiry_date: student.tokenExpiryDate?.getTime(),
  });

  oAuth2Client.on("tokens", async (tokens) => {
    if (tokens.access_token) student.googleAccessToken = tokens.access_token;
    if (tokens.refresh_token) student.googleRefreshToken = tokens.refresh_token;
    if (tokens.expiry_date)
      student.tokenExpiryDate = new Date(tokens.expiry_date);
    await student.save();
  });

  const calendar = google.calendar({ version: "v3", auth: oAuth2Client });

  const event = {
    summary,
    description,
    start: {
      dateTime: startTime,
      timeZone: "UTC",
    },
    end: {
      dateTime: endTime,
      timeZone: "UTC",
    },
    attendees, // uses passed-in array of both student and tutor
    reminders: {
      useDefault: false,
      overrides: [{ method: "popup", minutes: reminderMinutes }],
    },
    conferenceData: {
      createRequest: {
        requestId: `meet-${Date.now()}`, // unique for each call
        conferenceSolutionKey: {
          type: "hangoutsMeet",
        },
      },
    },
  };

  const result = await calendar.events.insert({
    calendarId: "primary",
    conferenceDataVersion: 1,
    requestBody: event,
  });

  return result.data;
};

export const refreshOAuthToken = async (user: any) => {
  if (!user.googleRefreshToken) {
    throw new Error("No refresh token found for user.");
  }

  const oAuth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URL,
  );

  oAuth2Client.setCredentials({ refresh_token: user.googleRefreshToken });

  try {
    const response = await oAuth2Client.refreshAccessToken();
    const tokens = response.credentials;

    user.googleAccessToken = tokens.access_token;
    user.tokenExpiryDate = tokens.expiry_date
      ? new Date(tokens.expiry_date)
      : new Date();
    await user.save();

    return tokens.access_token;
  } catch (error) {
    console.error("❌ Error refreshing token:", error);
    throw new Error("Error refreshing OAuth token.");
  }
};
