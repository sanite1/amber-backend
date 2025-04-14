import { Request, Response, NextFunction } from "express";
import {
  cancelLesson,
  createLesson,
  getAllLessons,
  getLessonById,
  getLessonsForTutor,
  updateLesson,
  updateLessonStatus,
} from "../services/lesson.service";
import ApiError from "../errors/apiError";
import Lesson from "../models/lesson";

export const bookLesson = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { accessToken, reminderMinutes } = req.body; // Pass from frontend
    const lesson = await createLesson(req.body, accessToken, reminderMinutes);
    return res.status(200).json(lesson);
  } catch (error) {
    next(error);
  }
};

export const getLessons = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const lessons = await getAllLessons();
    return res.status(200).json(lessons);
  } catch (error) {
    next(error);
  }
};

export const getLesson = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { lessonId } = req.params;
    const existingLesson = await Lesson.findById(lessonId);

    if (!existingLesson) {
      throw new ApiError(400, "Lesson not found");
    }
    const lesson = await getLessonById(lessonId);

    if (!lesson) {
      throw new ApiError(404, "Lesson not found");
    }

    return res.status(200).json(lesson);
  } catch (error) {
    next(error);
  }
};

export const updateLessonController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { lessonId } = req.params;
    const existingLesson = await Lesson.findById(lessonId);

    if (!existingLesson) {
      throw new ApiError(400, "Lesson not found");
    }

    const updatedLesson = await updateLesson(lessonId, req.body);

    // Prevent studentId and tutorId from being updated
    if (req.body.studentId || req.body.tutorId) {
      throw new ApiError(400, "Cannot update studentId or tutorId");
    }

    if (!updatedLesson) {
      throw new ApiError(404, "Lesson not found");
    }

    return res.status(200).json(updatedLesson);
  } catch (error) {
    next(error);
  }
};

export const cancelLessonController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { lessonId } = req.params;
    const existingLesson = await Lesson.findById(lessonId);

    if (!existingLesson) {
      throw new ApiError(400, "Lesson not found");
    }

    const result = await cancelLesson(lessonId);

    if (!result) {
      throw new ApiError(404, "Lesson not found");
    }

    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const getTutorLessons = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { tutorId } = req.params;
    const { status } = req.query;

    const lessons = await getLessonsForTutor(tutorId, status as string);
    return res.status(200).json(lessons);
  } catch (error) {
    next(error);
  }
};

export const getStudentLessons = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { studentId } = req.params;
    const { status } = req.query;

    const lessons = await getLessonsForTutor(studentId, status as string);
    return res.status(200).json(lessons);
  } catch (error) {
    next(error);
  }
};

export const updateLessonStatusController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { lessonId } = req.params;
    const { status } = req.body;

    const updatedLesson = await updateLessonStatus(lessonId, status);
    return res.status(200).json(updatedLesson);
  } catch (error) {
    next(error);
  }
};
