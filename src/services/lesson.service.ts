import moment from "moment-timezone";
import ApiError from "../errors/apiError";
import { ILesson, IUpdateLesson } from "../interfaces/lesson.interface";
import TutorAvailability from "../models/Availability";
import User from "../models/User";
import Lesson from "../models/lesson";
import ApiResponse from "../errors/apiResponse";
import { Types } from "mongoose";

export const createLesson = async (lessonData: ILesson) => {
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

  return new ApiResponse(200, "Lesson booked successfully", lesson);
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
  const lessons = await Lesson.find(query);

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
