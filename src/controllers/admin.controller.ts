import { Request, Response, NextFunction } from "express";
import {
  registerAdminService,
  loginAdminService,
  verifyAdminMailService,
  resetAdminPasswordService,
  getStudentsService,
  getTutorsService,
  updateStudentStatusService,
  forgotAdminPasswordService,
  updateTutorStatusService,
  definiteupdateStudentStatusService,
  definiteupdateTutorStatusService,
  autoReactivateTutors,
  autoReactivateStudents,
} from "../services/admin.service";
import ApiResponse from "../errors/apiResponse";
import { ExpresFunction } from "../interfaces/helper.interface";
import {
  CreateUserRequest,
  IUserLogin,
  IUserReset,
  IUserVerify,
} from "../interfaces/user.interface";
import ApiError from "../errors/apiError";
import { Types } from "mongoose";
import User from "../models/User";
import mongoose from "mongoose";
import { createNotificationService } from "../services/notification.service";

//Register a new admin
export const registerAdmin: ExpresFunction<CreateUserRequest> = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const admin = await registerAdminService(req.body);
    return res.status(201).json(admin);
  } catch (error) {
    next(error);
  }
};

//Admin login
export const loginAdmin: ExpresFunction<IUserLogin> = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const data = await loginAdminService(req.body);
    return res.status(200).json(data);
  } catch (error) {
    next(error);
  }
};

//Verify Admin Email
export const verifyAdminEmail: ExpresFunction<IUserVerify> = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id, token } = req.params as { id: string; token: string };
    if (!id || !token) {
      throw new ApiError(400, "Invalid verification parameters");
    }
    const objectId = new Types.ObjectId(id);
    const data = await verifyAdminMailService({ id: objectId, token });
    return res.status(200).json(data);
  } catch (error) {
    next(error);
  }
};

//Reset Admin Password
export const resetAdminPassword: ExpresFunction<IUserReset> = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id, token } = req.params as { id: string; token: string };
    const { password } = req.body;
    if (!id || !token) {
      throw new ApiError(400, "Invalid verification parameters");
    }
    const objectId = new Types.ObjectId(id);
    const data = await resetAdminPasswordService(
      { id: objectId, token },
      { password },
    );
    return res.status(200).json(data);
  } catch (error) {
    next(error);
  }
};

// Forgot Admin Password
export const forgotAdminPassword: ExpresFunction<{ email: string }> = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { email } = req.body;
    if (!email) {
      throw new ApiError(400, "Email is required");
    }
    const data = await forgotAdminPasswordService(email); // Call the service function
    return res.status(200).json(data);
  } catch (error) {
    next(error);
  }
};

//get all student
export const getStudents = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { adminId } = req.params;
    const admin = await User.findById(adminId);
    const { isActive, verified, startDate, endDate } = req.query;
    if (!admin) {
      throw new ApiError(404, "Admin not found");
    }
    if (admin.role !== "admin") {
      throw new ApiError(403, "Only Admin can send retrieve students");
    }
    const filters = {
      isActive: isActive === undefined ? undefined : isActive === "true",
      verified: verified === undefined ? undefined : verified === "true",
      startDate: startDate as string,
      endDate: endDate as string,
    };
    const students = await getStudentsService(filters);
    res
      .status(200)
      .json(new ApiResponse(200, "Student retrieved successfully", students));
  } catch (error) {
    next(error);
  }
};

//get all tutors
export const getTutors = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { adminId } = req.params;
    const admin = await User.findById(adminId);
    const { isActive, verified, startDate, endDate } = req.query;
    if (!admin) {
      throw new ApiError(404, "Admin not found");
    }
    if (admin.role !== "admin") {
      throw new ApiError(403, "Only Admin can send retrieve students");
    }
    const filters = {
      isActive: isActive === undefined ? undefined : isActive === "true",
      verified: verified === undefined ? undefined : verified === "true",
      startDate: startDate as string,
      endDate: endDate as string,
    };
    const tutors = await getTutorsService(filters);
    res
      .status(200)
      .json(new ApiResponse(200, "Tutor retrieved successfully", tutors));
  } catch (error) {
    next(error);
  }
};

//suspend student
export const suspendStudent = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { studentId } = req.params;
    const student = await updateStudentStatusService(studentId, false);
    await createNotificationService({
      userId: new mongoose.Types.ObjectId(studentId),
      type: "system",
      message: `Your account has been suspended`,
    });
    res
      .status(200)
      .json(new ApiResponse(200, "Student suspended successfully", student));
  } catch (error) {
    next(error);
  }
};

//suspend for a fixed amount of days
export const definiteSuspendStudent = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { studentId } = req.params;
    const { duration, unit } = req.body;
    const validUnits = ["minutes", "hours", "days", "weeks", "months"];
    if (!validUnits.includes(unit)) {
      throw new ApiError(400, "Invalid unit of time");
    }
    const student = await definiteupdateStudentStatusService(
      studentId,
      duration,
      unit,
      false,
    );
    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          `Student suspended for ${duration} ${unit}`,
          student,
        ),
      );
  } catch (error) {
    next(error);
  }
};

export const definiteSuspendTutor = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { tutorId } = req.params;
    const { duration, unit } = req.body;
    const validUnits = ["minutes", "hours", "days", "weeks", "months"];
    if (!validUnits.includes(unit)) {
      throw new ApiError(400, "Invalid unit of time");
    }
    const tutor = await definiteupdateTutorStatusService(
      tutorId,
      duration,
      unit,
      false,
    );
    res
      .status(200)
      .json(
        new ApiResponse(200, `Tutor suspended for ${duration} ${unit}`, tutor),
      );
  } catch (error) {
    next(error);
  }
};

//reactivate student
export const reactivateStudent = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { studentId } = req.params;
    const student = await updateStudentStatusService(studentId, true);
    await createNotificationService({
      userId: new mongoose.Types.ObjectId(studentId),
      type: "system",
      message: `You have been reactivated`,
    });
    res
      .status(200)
      .json(new ApiResponse(200, "Student reactivated successfully", student));
  } catch (error) {
    next(error);
  }
};

//suspend tutor
export const suspendTutor = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { tutorId } = req.params;
    const tutor = await updateTutorStatusService(tutorId, false);
    await createNotificationService({
      userId: new mongoose.Types.ObjectId(tutorId),
      type: "system",
      message: `Your account has been suspended`,
    });
    res
      .status(200)
      .json(new ApiResponse(200, "Tutor suspended successfully", tutor));
  } catch (error) {
    next(error);
  }
};

//Reactivate tutor
export const reactivateTutor = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { tutorId } = req.params;
    const tutor = await updateTutorStatusService(tutorId, true);
    await createNotificationService({
      userId: new mongoose.Types.ObjectId(tutorId),
      type: "system",
      message: `Your account has been reactivated`,
    });
    res
      .status(200)
      .json(new ApiResponse(200, "Tutor reactivated successfully", tutor));
  } catch (error) {
    next(error);
  }
};

// Manually trigger reactivation (for debugging)
export const reactivateStudentsManually = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    await autoReactivateStudents();
    res
      .status(200)
      .json(new ApiResponse(200, "Student reactivation process triggered."));
  } catch (error) {
    next(error);
  }
};

// Manually trigger reactivation (for debugging)
export const reactivateTutorsManually = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    await autoReactivateTutors();
    res
      .status(200)
      .json(new ApiResponse(200, "Tutor reactivation process triggered."));
  } catch (error) {
    next(error);
  }
};
