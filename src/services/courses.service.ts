import ApiError from "../errors/apiError";
import ApiResponse from "../errors/apiResponse";
import CourseBooking from "../models/course";
import {
  sendBookingApprovalEmail,
  sendCourseBookingConfirmation,
  sendCourseBookingNotification,
} from "./nodemailer/mail.service";

export const createCourseBookingService = async (data: any) => {
  try {
    const booking = data;

    if (!booking.course) {
      throw new ApiError(400, "Course information is missing in booking.");
    }

    if (
      booking.locationPreference === "your-premise" &&
      (!booking.address ||
        !booking.address.street ||
        !booking.address.city ||
        !booking.address.state)
    ) {
      throw new ApiError(
        400,
        "Full address is required for your-premise bookings.",
      );
    }

    if (!Array.isArray(booking.preferredDates)) {
      console.error(
        "❗ Preferred dates is not an array:",
        booking.preferredDates,
      );
      throw new ApiError(400, "Preferred dates must be an array.");
    }

    if (booking.preferredDates.length === 0) {
      console.error("❗ Preferred dates array is empty!");
      throw new ApiError(400, "At least one preferred date must be selected.");
    }

    // Convert preferred dates array of objects { date, time } to Date objects
    const preferredDateObjects = booking.preferredDates.map(
      (d: { date: string; time: string }) => ({
        date: new Date(d.date),
        time: d.time,
      }),
    );

    const bookingData = {
      course: {
        name: booking.course.name,
        duration: booking.course.duration,
        mode: booking.course.mode || "N/A",
        certification: booking.course.certification,
        price: booking.course.price,
      },
      fullName: booking.fullName,
      email: booking.email,
      phone: booking.phone,
      organizationName: booking.organizationName || "N/A",
      numberOfParticipants: booking.numberOfParticipants,
      locationPreference: booking.locationPreference,
      address: {
        street: booking.address?.street || "N/A",
        city: booking.address?.city || "N/A",
        state: booking.address?.state || "N/A",
      },
      preferredDates: preferredDateObjects,
      gdprConsent: booking.gdprConsent || true,
      status: "pending",
      paymentStatus: "paid",
    };

    // ✅ Create booking in database
    let savedBooking;
    try {
      savedBooking = await CourseBooking.create(bookingData);
    } catch (dbError) {
      console.error("❌ Database error:", dbError);
      throw new ApiError(400, `Database error: ${(dbError as any).message}`);
    }

    // Format dates for email with time information
    const formattedPreferredDates = booking.preferredDates
      .map((slot: { date: string; time: string }) => {
        const date = new Date(slot.date);
        return `${date.toLocaleDateString("en-GB")} at ${slot.time}`;
      })
      .join(", ");

    const formattedAddress =
      booking.locationPreference === "your-premise"
        ? `${booking.address?.street}, ${booking.address?.city}, ${booking.address?.state}`
        : "N/A";

    const emailContent = {
      course: bookingData.course,
      fullName: bookingData.fullName,
      email: bookingData.email,
      phone: bookingData.phone,
      organizationName: bookingData.organizationName,
      numberOfParticipants: bookingData.numberOfParticipants,
      locationPreference: bookingData.locationPreference,
      preferredDates: booking.preferredDates,
      formattedAddress,
      gdprConsent: bookingData.gdprConsent,
      status: bookingData.status,
      paymentStatus: bookingData.paymentStatus,
    };

    // Send emails with error handling
    try {
      await sendCourseBookingNotification(
        "support@ambertraining.co.uk",
        emailContent as any,
      );
    } catch (emailError) {
      console.error("❌ Error sending admin notification:", emailError);
      // Don't throw - log and continue so user booking isn't lost
    }

    try {
      await sendCourseBookingConfirmation(booking.email, emailContent as any);
    } catch (emailError) {
      console.error("❌ Error sending user confirmation:", emailError);
      // Don't throw - log and continue so user booking isn't lost
    }

    return new ApiResponse(
      200,
      "Booking request received. We will contact you shortly.",
      {
        bookingId: savedBooking._id,
        status: savedBooking.status,
        message: "Your booking has been recorded and is pending approval.",
      },
    );
  } catch (error) {
    console.error("🔥 Error in createCourseBookingService:", error);
    if (error instanceof ApiError) throw error;
    throw new ApiError(
      500,
      `Something went wrong while handling the booking request: ${(error as any).message}`,
    );
  }
};

export const approveCourseBookingService = async (bookingId: string) => {
  try {
    const booking = await CourseBooking.findByIdAndUpdate(
      bookingId,
      { status: "approved" },
      { new: true },
    );

    if (!booking) {
      throw new ApiError(404, "Booking not found.");
    }

    // Format dates for approval email
    const formattedPreferredDates = booking.preferredDates
      .map((slot: any) => {
        const date = new Date(slot.date);
        return `${date.toLocaleDateString("en-GB")} at ${slot.time}`;
      })
      .join(", ");

    const formattedAddress =
      booking.locationPreference === "your-premise"
        ? `${booking?.address?.street}, ${booking?.address?.city}, ${booking?.address?.state}`
        : "N/A";

    const emailContent = {
      course: booking.course,
      fullName: booking.fullName,
      email: booking.email,
      phone: booking.phone,
      organizationName: booking.organizationName,
      numberOfParticipants: booking.numberOfParticipants,
      locationPreference: booking.locationPreference,
      preferredDates: booking.preferredDates,
      formattedAddress,
      gdprConsent: booking.gdprConsent,
      status: booking.status,
      paymentStatus: booking.paymentStatus,
    };

    // Send approval email with error handling
    try {
      await sendBookingApprovalEmail(booking.email, emailContent as any);
    } catch (emailError) {
      console.error("❌ Error sending approval email:", emailError);
      // Don't throw - booking is already approved in DB
    }

    return new ApiResponse(200, "Booking approved successfully.", booking);
  } catch (error) {
    console.error("🔥 Error in approveCourseBookingService:", error);
    if (error instanceof ApiError) throw error;

    throw new ApiError(
      500,
      `Something went wrong while approving the booking: ${(error as any).message}`,
    );
  }
};

export const getBookedDatesService = async () => {
  try {
    const bookedBookings = await CourseBooking.find({
      status: "approved",
    });

    // Aggregate all preferred dates with time slots
    const bookedDates = bookedBookings.reduce((acc: any[], booking: any) => {
      booking.preferredDates.forEach((item: any) => {
        const dateString = new Date(item.date).toISOString().split("T")[0];
        const time = item.time || "N/A";

        acc.push({
          date: dateString,
          time: time,
          courseId: booking._id,
          courseName: booking.course.name,
        });
      });
      return acc;
    }, []);

    return new ApiResponse(200, "Booked dates retrieved successfully.", {
      totalBookedSlots: bookedDates.length,
      bookedDates: bookedDates.sort(
        (a: any, b: any) =>
          new Date(a.date).getTime() - new Date(b.date).getTime(),
      ),
    });
  } catch (error) {
    console.error("🔥 Error in getBookedDatesService:", error);
    if (error instanceof ApiError) throw error;

    throw new ApiError(
      500,
      `Something went wrong while fetching booked dates: ${(error as any).message}`,
    );
  }
};
export const getAllBookedDatesService = async () => {
  try {
    // Include both pending and approved bookings
    const bookedBookings = await CourseBooking.find({
      status: { $in: ["pending", "approved"] },
    });

    // Get dates with their booked times
    const bookedDatesMap = new Map<string, Set<string>>();

    bookedBookings.forEach((booking: any) => {
      booking.preferredDates.forEach((item: any) => {
        const dateString = new Date(item.date).toISOString().split("T")[0];
        const time = item.time || "N/A";

        if (!bookedDatesMap.has(dateString)) {
          bookedDatesMap.set(dateString, new Set());
        }
        bookedDatesMap.get(dateString)?.add(time);
      });
    });

    // Convert Map to array of objects
    const bookedDates = Array.from(bookedDatesMap, ([date, times]) => ({
      date,
      times: Array.from(times).sort(),
    })).sort((a, b) => a.date.localeCompare(b.date));

    return new ApiResponse(200, "Booked dates retrieved successfully.", {
      totalUniqueBookedDates: bookedDates.length,
      bookedDates,
    });
  } catch (error) {
    console.error("🔥 Error in getAllBookedDatesService:", error);
    if (error instanceof ApiError) throw error;

    throw new ApiError(
      500,
      `Something went wrong while fetching booked dates: ${(error as any).message}`,
    );
  }
};
