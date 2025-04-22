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
      (!booking.address || booking.address.trim() === "")
    ) {
      throw new ApiError(400, "Address is required for on-site bookings.");
    }

    // Ensure preferredDates is an array
    if (!Array.isArray(booking.preferredDates)) {
      console.error(
        "❗ Preferred dates is not an array:",
        booking.preferredDates,
      );
      throw new ApiError(400, "Preferred dates must be an array.");
    }

    // Check if preferredDates array is empty
    if (booking.preferredDates.length === 0) {
      console.error("❗ Preferred dates array is empty!");
    }

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
      // Convert preferredDates to Date objects and log the result
      preferredDates: booking.preferredDates.map((d: string) => {
        const date = new Date(d);
        return date;
      }),
      gdprConsent: true,
    };

    // Format the preferredDates as string
    const formattedPreferredDates = bookingData.preferredDates
      .map((date: Date) => date.toLocaleDateString("en-GB"))
      .join(", ");

    const emailContent = {
      ...bookingData,
      preferredDates: formattedPreferredDates,
    };

    await sendCourseBookingNotification("bahdguy496@gmail.com", emailContent);
    await sendCourseBookingConfirmation(booking.email, emailContent);

    // Save to the database and log if successful
    const savedBooking = await CourseBooking.create(bookingData);

    return new ApiResponse(
      200,
      "Booking request received. We will contact you shortly.",
      savedBooking,
    );
  } catch (error) {
    // Handle known ApiErrors
    if (error instanceof ApiError) throw error;

    // Log unexpected errors
    console.error("❗ Unexpected error in createCourseBookingService:", error);
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
      (!data.address || data.address.trim() === "")
    ) {
      throw new ApiError(400, "Address is required for on-site bookings.");
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

    const emailContent = {
      ...bookingData,
      preferredDates: formattedPreferredDates,
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
