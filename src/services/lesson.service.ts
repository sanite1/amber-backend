import moment from "moment-timezone";
import ApiError from "../errors/apiError";
import { ILesson, IUpdateLesson } from "../interfaces/lesson.interface";
import TutorAvailability from "../models/Availability";
import User from "../models/User";
import Lesson from "../models/lesson";
import ApiResponse from "../errors/apiResponse";
import { Types } from "mongoose";
import { createCalendarEvent } from "../services/calendar.service";
import { refreshOAuthToken } from "../services/calendar.service";
import { google } from "googleapis";

export const createLesson = async (
  lessonData: ILesson,
  studentAccessToken: string,
  reminderMinutes: number,
) => {
  const { tutorId, studentId, date, duration, status, price } = lessonData;

  // Find student and tutor
  const student = await User.findById(studentId);
  const tutor = await User.findById(tutorId);
  if (!student) {
    throw new ApiError(400, "Student not found");
  }
  if (student?.role !== "student") {
    throw new ApiError(400, "User must be a student to book a lesson");
  }
  if (!tutor || tutor?.role !== "tutor") {
    throw new ApiError(400, "Invalid tutor");
  }

  // Convert date to ISO format
  const dateISO = moment.utc(date).toISOString();

  // Check tutor availability
  const tutorAvailability = await TutorAvailability.findOne({ tutorId });

  if (
    !tutorAvailability?.timesForBooking ||
    tutorAvailability.timesForBooking.length === 0
  ) {
    throw new ApiError(500, "Tutor has no available time slots");
  }

  // Find an available time slot that matches the requested date
  const availableTimeIndex = tutorAvailability.timesForBooking.findIndex(
    (time) => {
      const formattedDateStart = moment
        .utc(time.dateStart)
        .format("YYYY-MM-DDTHH:mm:ss");
      const formattedDateISO = moment
        .utc(dateISO)
        .format("YYYY-MM-DDTHH:mm:ss");

      return formattedDateStart === formattedDateISO && time.status === "free";
    },
  );

  if (availableTimeIndex === -1) {
    throw new ApiError(500, "Tutor is not available on this date");
  }

  // Book the lesson: Update the status of the booked time slot
  tutorAvailability.timesForBooking[availableTimeIndex].status = "scheduled";

  // Save updated availability
  await tutorAvailability.save();

  // Create the lesson
  const lesson = await Lesson.create({
    tutorId,
    studentId,
    date,
    duration,
    // status,
    price,
  });
  const endTime = moment.utc(date).add(duration, "minutes").toISOString();

  // Create a Google Calendar event
  // (Adjust the summary and description as needed. Here we use tutor and student last names.)

  const studentWithToken = await User.findOne({ email: student.email });

  if (!studentWithToken) {
    throw new Error("Student not found");
  }

  const accessToken = studentWithToken.googleAccessToken;
  const refreshToken = studentWithToken.googleRefreshToken;

  if (!accessToken) {
    throw new Error("Access token not found for this student.");
  }
  const now = new Date().getTime();
  if (
    studentWithToken.tokenExpiryDate &&
    studentWithToken.tokenExpiryDate.getTime() <= now
  ) {
    await refreshOAuthToken(studentWithToken);
  }

  if (!accessToken || !refreshToken) {
    throw new Error("Missing Google Calendar access or refresh token.");
  }

  // Create the calendar event
  const calendarEvent = await createCalendarEvent({
    student,
    summary: `${student.lastname}, you have an ESOL lesson with ${tutor.lastname}`,
    description: `${duration}-minute session`,
    startTime: dateISO,
    endTime,
    recipientEmail: student.email, // optional now, used for older logic
    accessToken,
    reminderMinutes,
    attendees: [{ email: student.email }, { email: tutor.email }],
  });
  // 2. Extract the meet link
  const meetLink =
    calendarEvent.hangoutLink ||
    calendarEvent.conferenceData?.entryPoints?.find(
      (p) => p.entryPointType === "video",
    )?.uri;

  // 3. (Optional) Update the event to add the Meet link into its description
  if (meetLink && calendarEvent.id) {
    const oAuth2Client = new google.auth.OAuth2();
    oAuth2Client.setCredentials({ access_token: accessToken });

    const calendar = google.calendar({ version: "v3", auth: oAuth2Client });

    await calendar.events.patch({
      calendarId: "primary",
      eventId: calendarEvent.id, // ✅ Now guaranteed to be a string
      requestBody: {
        description: `${duration}-minute session\n\nGoogle Meet Link: ${meetLink}`,
      },
    });
  }

  return new ApiResponse(200, "Lesson booked successfully", {
    lesson,
    meetLink,
  });

  return new ApiResponse(200, "Lesson booked successfully", {
    lesson,
    meetLink: calendarEvent.hangoutLink, // <- this is the Google Meet link
  });
};

// Service function to get all lessons
export const getAllLessons = async () => {
  try {
    const lessons = await Lesson.find();
    return new ApiResponse(200, "Lessons retrieved successfully", lessons);
  } catch (error) {
    throw new ApiError(500, "Failed to retrieve lessons");
  }
};

export const getLessonById = async (lessonId: string) => {
  if (!Types.ObjectId.isValid(lessonId)) {
    throw new Error("Invalid lesson ID");
  }
  const lesson = await Lesson.findById(lessonId);

  return new ApiResponse(200, "Lesson retrieved successfully", lesson);
};

export const updateLesson = async (
  lessonId: string,
  updateData: IUpdateLesson,
) => {
  if (!Types.ObjectId.isValid(lessonId)) {
    throw new Error("Invalid lesson ID");
  }

  const lesson = await Lesson.findByIdAndUpdate(lessonId, updateData, {
    new: true,
  });

  return new ApiResponse(200, "Lesson updated successfully", lesson);
};

export const cancelLesson = async (lessonId: string) => {
  if (!Types.ObjectId.isValid(lessonId)) {
    throw new Error("Invalid lesson ID");
  }

  // Find the lesson
  const lesson = await Lesson.findById(lessonId);
  if (!lesson) {
    return null;
  }

  // Find tutor availability
  const tutorAvailability = await TutorAvailability.findOne({
    tutorId: lesson.tutorId,
  });
  if (tutorAvailability) {
    // Restore the booked slot to "free" status
    const bookedSlot = tutorAvailability.timesForBooking.find((slot) => {
      const formattedDateStart = moment
        .utc(slot.dateStart)
        .format("YYYY-MM-DDTHH:mm:ss");
      const formattedDateISO = moment
        .utc(lesson.date)
        .format("YYYY-MM-DDTHH:mm:ss");

      return formattedDateStart === formattedDateISO;
    });

    if (bookedSlot) {
      bookedSlot.status = "free";
      await tutorAvailability.save();
    }
  }

  // Delete the lesson
  await Lesson.findByIdAndDelete(lessonId);

  return new ApiResponse(200, "Lessons deleted successfully");
};

export const getLessonsForTutor = async (tutorId: string, status?: string) => {
  // Ensure the tutor exists
  const tutor = await User.findById(tutorId);
  if (!tutor || tutor.role !== "tutor") {
    throw new ApiError(404, "Tutor not found");
  }

  // Build query
  const query: any = { tutorId };
  if (status) {
    query.status = status;
  }

  // Fetch lessons
  const lessons = await Lesson.find(query);

  return new ApiResponse(200, "Lessons fetched successfully", lessons);
};

export const getLessonsForStudent = async (
  studentId: string,
  status?: string,
) => {
  // Ensure the student exists
  const student = await User.findById(studentId);
  if (!student || student.role !== "student") {
    throw new ApiError(404, "Student not found");
  }

  // Build query
  const query: any = { studentId };
  if (status) {
    query.status = status;
  }

  // Fetch lessons
  const lessons = await Lesson.find(query).populate({
    path: "studentId",
    select: "firstname lastname email",
  });

  return new ApiResponse(200, "Lessons fetched successfully", lessons);
};

export const updateLessonStatus = async (
  lessonId: string,
  status: "scheduled" | "completed" | "cancelled",
) => {
  // Find lesson
  const lesson = await Lesson.findById(lessonId);
  if (!lesson) {
    throw new ApiError(404, "Lesson not found");
  }

  // Check if the lesson is already canceled or completed
  if (lesson.status === "cancelled") {
    throw new ApiError(400, "Cannot update a cancelled lesson");
  }
  if (lesson.status === "completed") {
    throw new ApiError(400, "Cannot update a completed lesson");
  }

  // Update status
  lesson.status = status;
  await lesson.save();

  return new ApiResponse(200, "Lesson status updated successfully", lesson);
};
