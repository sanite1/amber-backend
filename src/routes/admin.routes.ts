import { Router } from "express";
import {
  registerAdminValidation,
  loginAdminValidation,
  verifyAdminValidation,
  resetAdminPasswordValidation,
  forgotAdminPasswordValidation,
  getStudentsStatusValidation,
  getTutorsStatusValidation,
  updateTutorStatusValidation,
  updateStudentStatusValidation,
  definiteupdateStudentStatusValidation,
  definiteupdateTutorStatusValidation,
} from "../validations/admin.validation";
import {
  registerAdmin,
  loginAdmin,
  verifyAdminEmail,
  resetAdminPassword,
  forgotAdminPassword,
  getStudents,
  getTutors,
  suspendStudent,
  reactivateStudent,
  suspendTutor,
  reactivateTutor,
  definiteSuspendStudent,
  reactivateStudentsManually,
  definiteSuspendTutor,
} from "../controllers/admin.controller";
import { upload } from "../config/upload";
import {
  isAdmin,
  isAuthenticated,
} from "../middlewares/authenticatedMiddleWare";

const router = Router();

//register admin
router
  .route("/register")
  .post(
    upload.fields([{ name: "profilePicture", maxCount: 1 }]),
    registerAdminValidation(),
    registerAdmin,
  );

//Admin login
router.post("/login", loginAdminValidation(), loginAdmin);

//Forgot password
router.post(
  "/forgot-password",
  forgotAdminPasswordValidation(),
  forgotAdminPassword,
);

//reset password
router.patch(
  "/reset-passworrd/:id/:token",
  resetAdminPasswordValidation(),
  resetAdminPassword,
);

//verify admin email
router.get("/verify/:id/:token", verifyAdminValidation(), verifyAdminEmail);

//get all students
router.get(
  "/:adminId/students",
  isAuthenticated,
  getStudentsStatusValidation(),
  isAdmin,
  getStudents,
);

//get all tutors
router.get(
  "/:adminId/tutors",
  isAuthenticated,
  getTutorsStatusValidation(),
  isAdmin,
  getTutors,
);

//Suspend a student
router.patch(
  "/:adminId/students/:studentId/suspend",
  isAuthenticated,
  updateStudentStatusValidation(),
  isAdmin,
  suspendStudent,
);

//Suspend a student for a fixed amount of time
router.patch(
  "/:adminId/students/:studentId/definite-suspend",
  isAuthenticated,
  isAdmin,
  definiteupdateStudentStatusValidation(),
  definiteSuspendStudent,
);

//Suspend a tutor for a fixed amount of time
router.patch(
  "/:adminId/tutors/:tutorId/definite-suspend",
  isAuthenticated,
  isAdmin,
  definiteupdateTutorStatusValidation(),
  definiteSuspendTutor,
);

//Reactivate a student
router.patch(
  "/:adminId/students/:studentId/reactivate",
  isAuthenticated,
  isAdmin,
  updateStudentStatusValidation(),
  reactivateStudent,
);

//Suspend a tutor
router.patch(
  "/:adminId/tutors/:tutorId/suspend",
  isAuthenticated,
  updateTutorStatusValidation(),
  isAdmin,
  suspendTutor,
);

//Reactivate a tutor
router.patch(
  "/:adminId/tutors/:tutorId/reactivate",
  isAuthenticated,
  updateTutorStatusValidation(),
  isAdmin,
  reactivateTutor,
);

// Manually trigger student reactivation
router.post(
  "/reactivate-students",
  isAuthenticated,
  reactivateStudentsManually,
);

export default router;
