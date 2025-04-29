import CourseBooking from "../models/course";
import ApiError from "../errors/apiError";
import ApiResponse from "../errors/apiResponse";
import { createNotificationService } from "./notification.service";
import User from "../models/User"; // assuming you have a user model
import CourseBookingSchema from "../models/course";
import transporter from "./nodemailer/nodemailer";
import { sendCourseBookingNotification } from "./nodemailer/mail.service";
import { sendCourseBookingConfirmation } from "./nodemailer/mail.service";
import { sendBookingApprovalEmail } from "./nodemailer/mail.service";

export const createCourseBookingService = async (data: any) => {
  try {
    const booking = data;

    if (!booking.course) {
      throw new ApiError(400, "Course information is missing in booking.");
    }

    if (
      booking.locationPreference === "on-site" &&
      (!booking.address ||
        !booking.address.street ||
        !booking.address.city ||
        !booking.address.state)
    ) {
      throw new ApiError(400, "Full address is required for on-site bookings.");
    }

    if (!Array.isArray(booking.preferredDates)) {
      console.error("❗ Preferred dates is not an array:", booking.preferredDates);
      throw new ApiError(400, "Preferred dates must be an array.");
    }

    if (booking.preferredDates.length === 0) {
      console.error("❗ Preferred dates array is empty!");
    }

    const preferredDateObjects = booking.preferredDates.map((d: string) => new Date(d));

    const bookingData = {
      course: {
        name: booking.course.name,
        duration: booking.course.duration,
        mode: booking.course.mode,
        certification: booking.course.certification,
        price: booking.course.price,
      },
      fullName: booking.fullName,
      email: booking.email,
      phone: booking.phone,
      organizationName: booking.organizationName || "N/A",
      numberOfParticipants: booking.numberOfParticipants,
      locationPreference: booking.locationPreference,
      address: booking.address || "N/A",
      preferredDates: preferredDateObjects,
      gdprConsent: true,
    };

    const formattedPreferredDates = preferredDateObjects
      .map((date: Date) => date.toLocaleDateString("en-GB"))
      .join(", ");

    const formattedAddress =
      booking.address && typeof booking.address === "object"
        ? `${booking.address.street}, ${booking.address.city}, ${booking.address.postcode}`
        : "";

    const emailContent = {
      ...bookingData,
      preferredDates: formattedPreferredDates,
      formattedAddress,
    };

    await sendCourseBookingNotification("support@ambertraining.co.uk", emailContent);
    await sendCourseBookingConfirmation(booking.email, emailContent);

    return new ApiResponse(
      200,
      "Booking request received. We will contact you shortly.",
      bookingData,
    );
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(
      500,
      "Something went wrong while handling the booking request",
    );
  }
};

export const approveCourseBookingService = async (data: any) => {
  try {
    if (!data.course) {
      throw new ApiError(400, "Course information is missing in booking.");
    }
    if (
      data.locationPreference === "on-site" &&
      (!data.address ||
        !data.address.street ||
        !data.address.city ||
        !data.address.state)
    ) {
      throw new ApiError(400, "Full address is required for on-site bookings.");
    }
    if (!Array.isArray(data.preferredDates)) {
      console.error("❗ Preferred dates is not an array:", data.preferredDates);
      throw new ApiError(400, "Preferred dates must be an array.");
    }

    // Check if preferredDates array is empty
    if (data.preferredDates.length === 0) {
      console.error("❗ Preferred dates array is empty!");
    }

    const bookingData = {
      course: {
        name: data.course.name,
        duration: data.course.duration,
        mode: data.course.mode,
        certification: data.course.certification,
        price: data.course.price,
      },
      fullName: data.fullName,
      email: data.email,
      phone: data.phone,
      organizationName: data.organizationName || "N/A",
      numberOfParticipants: data.numberOfParticipants,
      locationPreference: data.locationPreference,
      address: data.address || "N/A",
      preferredDates: data.preferredDates.map((d: string) => new Date(d)),
      gdprConsent: true,
    };

    const formattedPreferredDates = bookingData.preferredDates
      .map((date: Date) => date.toLocaleDateString("en-GB"))
      .join(", ");

    // ✅ Format the address here
    const formattedAddress =
      typeof data.address === "object"
        ? `${data.address.street}, ${data.address.city}, ${data.address.postcode || data.address.state || ""}`
        : data.address;

    // Add formattedPreferredDates and formattedAddress to email content
    const emailContent = {
      ...bookingData,
      preferredDates: formattedPreferredDates,
      formattedAddress, // Add this for use in your template
    };

    await sendBookingApprovalEmail(data.email, emailContent);

    const savedBooking = await CourseBooking.create(bookingData);

    return savedBooking;
  } catch (error) {
    if (error instanceof ApiError) throw error;

    console.error("🔥 Unexpected error during booking approval:", error);
    throw new ApiError(
      500,
      "Something went wrong while approving the booking.",
    );
  }
};