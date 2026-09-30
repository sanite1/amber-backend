import { Request, Response, NextFunction } from "express";
import ApiResponse from "../errors/apiResponse";
import ApiError from "../errors/apiError";
import {
  sendEnquiryMail,
  sendBookingEnquiryMail,
} from "../services/nodemailer/mail.service";
import BookingEnquiryLog from "../models/BookingEnquiryLog";
import {
  assessSubmission,
  checkRateLimit,
  clip,
  isValidEmail,
} from "../services/spamGuard";

const SUCCESS_BOOKING =
  "Thank you. We will be in touch within 24 hours with your confirmation and invoice.";
const SUCCESS_ENQUIRY =
  "Thank you for your enquiry. We will be in touch shortly.";
const COURSES = ["EFAW", "FAW", "PFA"];

// Handle a B2B on-site training booking / quote request.
export const createBookingEnquiryController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const body = req.body || {};
    const { attribution } = body;
    // Every free-text field is trimmed and length capped (never rejected for
    // length, so a long genuine message is not lost).
    const companyName = clip(body.companyName, 150);
    const contactName = clip(body.contactName, 100);
    const email = clip(body.email, 254);
    const phone = clip(body.phone, 30);
    const courseType = clip(body.courseType, 10)?.toUpperCase();
    const delegates = clip(body.delegates, 30);
    const preferredDates = clip(body.preferredDates, 300);
    const venueAddress = clip(body.venueAddress, 300);
    const specialRequirements = clip(body.specialRequirements, 3000);
    const source = clip(body.source, 100);

    // First-touch attribution captured by the frontend (ads / organic /
    // referral / direct). Optional, and sanitised to known string fields with
    // a length cap so nothing unexpected reaches the email or the log.
    const str = (v: unknown) =>
      typeof v === "string" && v.trim() ? v.slice(0, 500) : undefined;
    const safeAttribution =
      attribution && typeof attribution === "object"
        ? {
            channel: str((attribution as any).channel),
            landingPage: str((attribution as any).landingPage),
            referrer: str((attribution as any).referrer),
            utmSource: str((attribution as any).utmSource),
            utmMedium: str((attribution as any).utmMedium),
            utmCampaign: str((attribution as any).utmCampaign),
            utmTerm: str((attribution as any).utmTerm),
            utmContent: str((attribution as any).utmContent),
            gclid: str((attribution as any).gclid),
            firstSeen: str((attribution as any).firstSeen),
          }
        : undefined;

    if (!companyName || !contactName || !email || !courseType) {
      return next(
        new ApiError(
          400,
          "Please provide your company, contact name, email and course type.",
        ),
      );
    }

    if (!isValidEmail(email)) {
      return next(new ApiError(400, "Please provide a valid email address."));
    }
    if (!COURSES.includes(courseType)) {
      return next(new ApiError(400, "Please choose a course."));
    }

    const verdict = assessSubmission({
      honeypot: body.website,
      fillMs: body.fillMs,
      names: [companyName, contactName],
      texts: [specialRequirements, venueAddress, preferredDates],
      phone,
    });
    if (verdict.action === "drop") {
      // Look successful so the bot learns nothing; send and store nothing.
      console.warn(`booking dropped as spam (${verdict.reason})`);
      return res.status(200).json(new ApiResponse(200, SUCCESS_BOOKING));
    }
    const spamFlags = verdict.flags;

    const limited = await checkRateLimit(req, "booking", email);
    if (limited) return next(new ApiError(429, limited));

    await sendBookingEnquiryMail({
      companyName,
      contactName,
      email,
      phone,
      courseType,
      delegates,
      preferredDates,
      venueAddress,
      specialRequirements,
      source,
      attribution: safeAttribution,
      spamFlags,
    });

    // Durable, scannable record of the enquiry and where it came from.
    // Best-effort: a logging failure must never fail a real enquiry.
    try {
      await BookingEnquiryLog.create({
        companyName,
        contactName,
        email,
        phone,
        courseType,
        delegates,
        preferredDates,
        venueAddress,
        specialRequirements,
        source,
        attribution: safeAttribution,
        spamFlags,
        fillMs: Number.isFinite(Number(body.fillMs))
          ? Number(body.fillMs)
          : undefined,
      });
    } catch (logError) {
      console.error(
        "booking enquiry log write failed:",
        logError instanceof Error ? logError.message : logError,
      );
    }

    return res.status(200).json(new ApiResponse(200, SUCCESS_BOOKING));
  } catch (error) {
    if (error instanceof ApiError) {
      return res
        .status(error.statusCode)
        .json({ status: error.statusCode, message: error.message });
    }
    console.error("❗ Failed to send booking request:", error);
    return next(
      new ApiError(500, "Failed to send booking request. Please try again."),
    );
  }
};

// First-touch attribution sent by the contact form, sanitised the same way as
// the booking handler above: known string fields only, length capped.
const sanitiseAttribution = (attribution: unknown) => {
  if (!attribution || typeof attribution !== "object") return undefined;
  const a = attribution as Record<string, unknown>;
  const str = (v: unknown) =>
    typeof v === "string" && v.trim() ? v.slice(0, 500) : undefined;
  return {
    channel: str(a.channel),
    landingPage: str(a.landingPage),
    referrer: str(a.referrer),
    utmSource: str(a.utmSource),
    utmMedium: str(a.utmMedium),
    utmCampaign: str(a.utmCampaign),
    utmTerm: str(a.utmTerm),
    utmContent: str(a.utmContent),
    gclid: str(a.gclid),
    firstSeen: str(a.firstSeen),
  };
};

// Handle a website enquiry / contact form submission.
export const createEnquiryController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const body = req.body || {};
    const firstName = clip(body.firstName, 100);
    const lastName = clip(body.lastName, 100);
    const email = clip(body.email, 254);
    const phone = clip(body.phone, 30);
    const message = clip(body.message, 5000);
    const courseInterest = clip(body.courseInterest, 100);
    const source = clip(body.source, 100);
    const safeAttribution = sanitiseAttribution(body.attribution);

    if (!firstName || !email || !message) {
      return next(
        new ApiError(400, "Please provide your name, email and a message."),
      );
    }

    if (!isValidEmail(email)) {
      return next(new ApiError(400, "Please provide a valid email address."));
    }

    const verdict = assessSubmission({
      honeypot: body.website,
      fillMs: body.fillMs,
      names: [firstName, lastName],
      texts: [message],
      phone,
    });
    if (verdict.action === "drop") {
      console.warn(`enquiry dropped as spam (${verdict.reason})`);
      return res.status(200).json(new ApiResponse(200, SUCCESS_ENQUIRY));
    }
    const spamFlags = verdict.flags;

    const limited = await checkRateLimit(req, "contact", email);
    if (limited) return next(new ApiError(429, limited));

    await sendEnquiryMail({
      firstName,
      lastName,
      email,
      phone,
      message,
      courseInterest,
      source,
      attribution: safeAttribution,
      spamFlags,
    });

    // Same durable log as bookings, marked kind "contact", so every enquiry
    // and where it came from can be scanned in one place. Best-effort.
    try {
      await BookingEnquiryLog.create({
        kind: "contact",
        contactName: `${firstName} ${lastName || ""}`.trim(),
        email,
        phone,
        courseInterest,
        message,
        source,
        attribution: safeAttribution,
        spamFlags,
        fillMs: Number.isFinite(Number(body.fillMs))
          ? Number(body.fillMs)
          : undefined,
      });
    } catch (logError) {
      console.error(
        "contact enquiry log write failed:",
        logError instanceof Error ? logError.message : logError,
      );
    }

    return res.status(200).json(new ApiResponse(200, SUCCESS_ENQUIRY));
  } catch (error) {
    if (error instanceof ApiError) {
      return res
        .status(error.statusCode)
        .json({ status: error.statusCode, message: error.message });
    }
    console.error("❗ Failed to send enquiry:", error);
    return next(new ApiError(500, "Failed to send enquiry. Please try again."));
  }
};
