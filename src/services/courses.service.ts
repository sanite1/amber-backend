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

    // 🔔 Notify Admin(s)

    if (!booking.course) {
      throw new ApiError(400, "Course information is missing in booking.");
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
      preferredDates: booking.preferredDates.map((d: string) => new Date(d)), // Convert to Date
    };

    // Format preferredDates for display
    const formattedPreferredDates = bookingData.preferredDates
      .map((date: Date) => date.toLocaleDateString("en-GB"))
      .join(", ");

    // Replace the raw preferredDates with formattedPreferredDates for email
    const emailContent = {
      ...bookingData,
      preferredDates: formattedPreferredDates, // ✅ overwrite with human-readable string
    };

    // Send admin emai
    await sendCourseBookingNotification(
      "support@ambertraining.co.uk",
      emailContent,
    );

    // Send user confirmation email
    await sendCourseBookingConfirmation(booking.email, emailContent);

    return new ApiResponse(
      200,
      "Booking request received. We will contact you shortly.",
      booking,
    );
  } catch (error) {
    throw new ApiError(
      500,
      "Something went wrong while handling the booking request",
    );
  }
};

//Approve Lesson
export const approveCourseBookingService = async (data: any) => {
  try {
    if (!data.course) {
      console.error("❌ Missing course info in booking");
      throw new ApiError(400, "Course information is missing in booking.");
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
      preferredDates: data.preferredDates.map((d: string) => new Date(d)), // Convert strings to Date
    };

    const formattedPreferredDates = bookingData.preferredDates
      .map((date: Date) => date.toLocaleDateString("en-GB"))
      .join(", ");

    const emailContent = {
      ...bookingData,
      preferredDates: formattedPreferredDates, // Replace with formatted string
    };

    await sendBookingApprovalEmail(data.email, emailContent);

    const savedBooking = await CourseBooking.create(bookingData);
    const check = await CourseBooking.findById(savedBooking._id);
    return savedBooking; // Return saved DB record
  } catch (error) {
    console.error("🔥 Error during booking approval:", error);
    throw new ApiError(
      500,
      "Something went wrong while approving the booking.",
    );
  }
};
