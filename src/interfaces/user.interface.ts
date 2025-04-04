import { Types } from "mongoose";

export interface CreateUserRequest {
  firstname: string;
  lastname: string;
  email: string;
  phoneNumber: string;
  password: string;
  role?: "admin" | "tutor" | "student"; // Defaults to "student"
  profilePicture?: string; // Optional field
  isVerified?: boolean; // Defaults to false
  isActive?: boolean; // Defaults to true
}
export interface ISendEmail {
  email: string;
  user: string;
}

export interface IUserLogin {
  email: string;
  password: string;
}

export interface IUserRefresh {
  token: string;
}
export interface IUserVerify {
  id: Types.ObjectId;
  token: string;
}

export interface IUserReset {
  password: string;
}
export interface IPasswordReset {
  oldPassword: string;
  newPassword: string;
  confirmNewPassword: string;
}
export interface ICertification {
  name: string;
  issuedBy: string;
  year: string;
}

export interface IUser extends Document {
  _id: Types.ObjectId;
  firstname: string;
  lastname: string;
  email: string;
  phoneNumber: string;
  profilePicture?: string;
  password: string; // Hashed password
  role: "admin" | "tutor" | "student"; // User role
  verified: boolean; // Email verification status
  isActive: boolean; // Account activation status
  verificationToken?: string;
  resetToken?: string;
  resetTokenExpires?: Date;
  timezone?: string;
  languages?: string[];
  bio?: string;
  ratings?: string;
  totalLessons?: number;
  numberOfReviews?: number;
  hourlyRate?: number;
  yearsOfExperience?: number;
  certifications?: ICertification[];
  createdAt: Date;
  updatedAt: Date;
}
