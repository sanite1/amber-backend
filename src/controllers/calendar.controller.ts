// controllers/calendar.controller.ts
import { NextFunction, Request, Response } from "express";
import { createCalendarEvent } from "../services/calendar.service";
import { oAuth2Client, SCOPES } from "../config/calendar";
import User from "../models/User";
import { google } from "googleapis";

// Route to initiate OAuth2 process and get the authorization URL
export const intiateAuth = async (req: Request, res: Response) => {
  const url = oAuth2Client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
    prompt: "consent",
  });

  res.json({ url });
};

export const handleGoogleOAuthCallback = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const code = req.query.code as string;

  if (!code) {
    return res.status(400).json({ error: "Missing code parameter." });
  }

  try {
    const { tokens } = await oAuth2Client.getToken(code);
    oAuth2Client.setCredentials(tokens);
    const oauth2 = google.oauth2({ version: "v2", auth: oAuth2Client });
    const { data: profile } = await oauth2.userinfo.get();

    if (!profile.email) {
      return res.status(400).json({ error: "No email returned from Google." });
    }

    const student = await User.findOne({ email: profile.email });

    if (!student) {
      return res.status(404).json({ error: "Student not found in database." });
    }

    if (tokens.access_token) {
      student.googleAccessToken = tokens.access_token;
    }

    if (tokens.refresh_token) {
      student.googleRefreshToken = tokens.refresh_token;
    } else {
      return res.status(400).json({ error: "Token not found" });
    }

    if (tokens.expiry_date) {
      student.tokenExpiryDate = new Date(tokens.expiry_date);
    }

    await student.save();

    return res
      .status(200)
      .json({ message: "Token saved. Google Calendar is connected." });
  } catch (error) {
    return res.status(500).json({ error: "Failed to handle OAuth callback." });
  }
};
