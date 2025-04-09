import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { randomBytes } from "crypto";
import ApiError from "../errors/apiError";
import ApiResponse from "../errors/apiResponse";
import { IUserDecoded } from "../middlewares/authenticatedMiddleWare";
import User from "../models/User";
import { createNotificationService } from "./notification.service";
import {
  sendVerificationMail,
  sendforgotPasswordMail,
  sendNotificationMail,
} from "./nodemailer/mail.service";
import {
  CreateUserRequest,
  IUserLogin,
  IUserVerify,
  IUserReset,
} from "../interfaces/user.interface";
import { UserFilterOptions } from "../interfaces/filter.interface";

const saltRounds = 13;

//Register a new admin

export const registerAdminService = async (data: CreateUserRequest) => {
  const existingUser = await User.findOne({ email: data.email });
  if (existingUser) throw new ApiError(400, "Email already in use");

  const hashedPassword = await bcrypt.hash(data.password, saltRounds);
  const verificationToken = randomBytes(32).toString("hex");

  const admin = await User.create({
    ...data,
    password: hashedPassword,
    verificationToken,
    role: "admin", // ✅ Ensure this user is an admin
  });

  await sendVerificationMail(admin);
  return new ApiResponse(200, "Admin Registered Successfully", admin.toJSON());
};

//Admin login
export const loginAdminService = async (data: IUserLogin) => {
  const admin = await User.findOne({ email: data.email, role: "admin" });

  if (!admin) {
    throw new ApiError(400, "Invalid Email/Password");
  }

  const isValidPassword = await bcrypt.compare(data.password, admin.password);
  if (!isValidPassword) {
    throw new ApiError(400, "Invalid Email/Password");
  }

  if (!admin.verified) {
    throw new ApiError(400, "Please verify your email");
  }

  const payload = {
    id: admin._id,
    firstname: admin.firstname,
    lastname: admin.lastname,
    email: admin.email,
    profilePicture: admin.profilePicture,
  };

  const JWT_SECRET = process.env.JWT_SECRET;
  if (!JWT_SECRET) {
    throw new ApiError(500, "JWT secret is not configured");
  }

  const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: "5h" });
  const refreshToken = jwt.sign(payload, JWT_SECRET, { expiresIn: "6d" });

  return new ApiResponse(200, "Admin Login Successful", {
    accessToken,
    refreshToken,
  });
};

/**
 * Verify Admin Email
 */
export const verifyAdminMailService = async (data: IUserVerify) => {
  const admin = await User.findOne({
    _id: data.id,
    verificationToken: data.token,
    role: "admin",
  });

  if (!admin) {
    throw new ApiError(400, "Admin not found or invalid token");
  }

  admin.verified = true;
  admin.verificationToken = undefined;
  await admin.save();

  return new ApiResponse(200, "Admin Email Verified Successfully");
};

/**
 * Reset Admin Password
 */
export const resetAdminPasswordService = async (
  params: IUserVerify,
  data: IUserReset,
) => {
  const admin = await User.findOne({
    _id: params.id,
    resetToken: params.token,
    role: "admin",
  });

  if (!admin) {
    throw new ApiError(400, "Admin not found");
  }

  if (!admin.resetToken || new Date(admin.resetToken).getTime() < Date.now()) {
    admin.resetToken = undefined;
    throw new ApiError(400, "Token has expired");
  }

  admin.password = await bcrypt.hash(data.password, saltRounds);
  admin.resetToken = undefined;

  await admin.save();
  return new ApiResponse(200, "Password Reset Successfully");
};

// Forgot Admin Password
export const forgotAdminPasswordService = async (email: string) => {
  // Step 1: Check if the admin exists with the provided email
  const admin = await User.findOne({ email, role: "admin" });
  if (!admin) {
    throw new ApiError(404, "Admin not found");
  }

  const resetToken = randomBytes(32).toString("hex");

  admin.resetToken = resetToken;
  await admin.save();

  const resetLink = `${process.env.APP_URL}/reset-password/${admin._id}/${resetToken}`; // Adjust APP_URL accordingly
  await sendforgotPasswordMail(admin);

  return new ApiResponse(200, "Password reset email sent");
};

//get all student
export const getStudentsService = async (filters: UserFilterOptions) => {
  const query: any = { role: "student" };
  if (filters.isActive !== undefined) query.isActive = filters.isActive;
  if (filters.verified !== undefined) query.verified = filters.verified;

  if (filters.startDate || filters.endDate) {
    query.createdAt = {};
    if (filters.startDate) query.createdAt.$gte = new Date(filters.startDate);
    if (filters.endDate) query.createdAt.$lte = new Date(filters.endDate);
  }
  return await User.find(query);
};

//get all tutor
export const getTutorsService = async (filters: UserFilterOptions) => {
  const query: any = { role: "tutor" };
  if (filters.isActive !== undefined) query.isActive = filters.isActive;
  if (filters.verified !== undefined) query.verified = filters.verified;

  if (filters.startDate || filters.endDate) {
    query.createdAt = {};
    if (filters.startDate) query.createdAt.$gte = new Date(filters.startDate);
    if (filters.endDate) query.createdAt.$lte = new Date(filters.endDate);
  }
  return await User.find(query);
};

export const updateStudentStatusService = async (
  studentId: string,
  isActive: boolean,
) => {
  const student = await User.findById(studentId);

  if (!student) {
    throw new ApiError(404, "Student not found");
  }
  student.isActive = isActive;
  await student.save();
  return student;
};

export const definiteupdateStudentStatusService = async (
  studentId: string,
  duration: number,
  unit: "minutes" | "hours" | "days" | "weeks" | "months",
  isActive: boolean,
) => {
  const student = await User.findById(studentId);
  if (!student) {
    throw new ApiError(404, "Student not found");
  }
  const suspensionEnd = new Date();
  switch (unit) {
    case "minutes":
      suspensionEnd.setMinutes(suspensionEnd.getMinutes() + duration);
      break;
    case "hours":
      suspensionEnd.setHours(suspensionEnd.getHours() + duration);
      break;
    case "days":
      suspensionEnd.setDate(suspensionEnd.getDate() + duration);
      break;
    case "weeks":
      suspensionEnd.setDate(suspensionEnd.getDate() + duration * 7);
      break;
    case "months":
      suspensionEnd.setMonth(suspensionEnd.getMonth() + duration);
      break;
    default:
      throw new ApiError(400, "Invalid time unit");
  }
  student.isActive = isActive;
  student.suspensionEnd = suspensionEnd;
  await student.save();
  createNotificationService({
    userId: new mongoose.Types.ObjectId(studentId),
    type: "system",
    message: `Your account has been suspended for ${duration} ${unit}. You will be reactivated after the suspension ends.`,
  });
  return student;
};

// export const updateStudentStatusService = async(studentId:string,isActive:boolean)=>{

//   const student = await User.findById(studentId);

//   if(!student){throw new ApiError(404,"Student not found");}
//   student.isActive = isActive;
//   await student.save();
//   return student;
// };

export const definiteupdateTutorStatusService = async (
  tutorId: string,
  duration: number,
  unit: "minutes" | "hours" | "days" | "weeks" | "months",
  isActive: boolean,
) => {
  const tutor = await User.findById(tutorId);
  if (!tutor) {
    throw new ApiError(404, "Tutor not found");
  }
  const suspensionEnd = new Date();
  switch (unit) {
    case "minutes":
      suspensionEnd.setMinutes(suspensionEnd.getMinutes() + duration);
      break;
    case "hours":
      suspensionEnd.setHours(suspensionEnd.getHours() + duration);
      break;
    case "days":
      suspensionEnd.setDate(suspensionEnd.getDate() + duration);
      break;
    case "weeks":
      suspensionEnd.setDate(suspensionEnd.getDate() + duration * 7);
      break;
    case "months":
      suspensionEnd.setMonth(suspensionEnd.getMonth() + duration);
      break;
    default:
      throw new ApiError(400, "Invalid time unit");
  }
  tutor.isActive = isActive;
  tutor.suspensionEnd = suspensionEnd;
  await tutor.save();
  createNotificationService({
    userId: new mongoose.Types.ObjectId(tutor._id),
    type: "system",
    message: `Your account has been suspended for ${duration} ${unit}. You will be reactivated after the suspension ends.`,
  });
  return tutor;
};

export const autoReactivateStudents = async () => {
  const now = new Date();

  const studentsToReactivate = await User.find({
    isActive: false,
    suspensionEnd: { $lte: now },
    role: "student",
  });
  if (studentsToReactivate.length === 0) {
    console.log("No students to reactivate.");
  }
  for (const student of studentsToReactivate) {
    student.isActive = true;
    student.suspensionEnd = undefined;
    await student.save();
    await createNotificationService({
      userId: new mongoose.Types.ObjectId(student._id),
      type: "system",
      message: `Your account has been reactivated, login to the dashboard`,
    });
  }
  return new ApiResponse(
    200,
    `${studentsToReactivate.length} students reactivated successfully`,
    studentsToReactivate,
  );
};

export const autoReactivateTutors = async () => {
  const now = new Date();

  const tutorsToReactivate = await User.find({
    isActive: false,
    suspensionEnd: { $lte: now },
    role: "tutor",
  });
  if (tutorsToReactivate.length === 0) {
    console.log("No tutors to reactivate.");
  }
  for (const tutor of tutorsToReactivate) {
    tutor.isActive = true;
    tutor.suspensionEnd = undefined;
    await tutor.save();
    await createNotificationService({
      userId: new mongoose.Types.ObjectId(tutor._id),
      type: "system",
      message: `Your account has been reactivated, login to the dashboard`,
    });
  }
  return new ApiResponse(
    200,
    `${tutorsToReactivate.length} tutors reactivated successfully`,
    tutorsToReactivate,
  );
};

export const updateTutorStatusService = async (
  tutorId: string,
  isActive: boolean,
) => {
  const tutor = await User.findById(tutorId);
  if (!tutor) {
    throw new ApiError(404, "Tutor not found");
  }
  tutor.isActive = isActive;
  await tutor.save();
  return tutor;
};
