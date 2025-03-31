import { Router } from "express";
import { isAuthenticated } from "../middlewares/authenticatedMiddleWare";
import {
  validateCreateLesson,
  validateDeleteLesson,
  validateGetLesson,
  validateGetStudentLessons,
  validateGetTutorLessons,
  validateUpdateLesson,
  validateUpdateLessonStatus,
} from "../validations/lesson.validation";
import {
  bookLesson,
  cancelLessonController,
  getLesson,
  getLessons,
  getStudentLessons,
  getTutorLessons,
  updateLessonController,
  updateLessonStatusController,
} from "../controllers/lesson.controller";

const router = Router();

// Create a Lesson (Book a Lesson) – POST /lessons
router
  .route("/create")
  .post(isAuthenticated, validateCreateLesson(), bookLesson);

// Get All Lessons – GET /lessons
router.route("/").get(isAuthenticated, getLessons);

// Get a Single Lesson – GET /lessons/{lesson_id}
// Update a Lesson – PATCH /lessons/{lesson_id}
// Cancel a Lesson – DELETE /lessons/{lesson_id}
router
  .route("/:lessonId")
  .get(isAuthenticated, validateGetLesson(), getLesson)
  .patch(isAuthenticated, validateUpdateLesson(), updateLessonController)
  .delete(isAuthenticated, validateDeleteLesson(), cancelLessonController);

// Get Lessons for a Tutor – GET /tutors/{tutor_id}/lessons
router
  .route("/tutor/:tutorId")
  .get(isAuthenticated, validateGetTutorLessons(), getTutorLessons);

// Get Lessons for a Student – GET /students/{student_id}/lessons
router
  .route("/student/:studentId")
  .get(isAuthenticated, validateGetStudentLessons(), getStudentLessons);

// Update Lesson Status – PATCH /lessons/{lesson_id}/status
router
  .route("/status/:lessonId")
  .patch(
    isAuthenticated,
    validateUpdateLessonStatus(),
    updateLessonStatusController,
  );

export default router;
