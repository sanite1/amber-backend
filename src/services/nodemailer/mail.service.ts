import { createTransport } from "nodemailer";
import ApiError from "../../errors/apiError";
import { IUser } from "../../interfaces/user.interface";
import transporter from "./nodemailer";
import { CourseBooking } from "../../interfaces/coursebooking.interface";
import path from "path";
import fs from "fs";
import { CheckoutItem } from "../../interfaces/payment.interface";

const DOMAIN_NAME = process.env.DOMAIN_NAME;
export const sendVerificationMail = async (userInfo: IUser) => {
  const mailOptions = {
    from: `"Amber Training" <${process.env.AUTH_EMAIL}>`,
    to: userInfo.email,
    template: "./verifyemail",
    subject: "Verify your email",
    context: {
      name: userInfo.lastname,
      email: userInfo.email,
      url: `${DOMAIN_NAME}/verify/${userInfo._id}/${userInfo.verificationToken}`,
    },
  };
  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    throw new ApiError(500, `Error sending verification email ${error}`);
  }
};

export const sendforgotPasswordMail = async (userInfo: IUser) => {
  const mailOptions = {
    from: `"Amber Training" <${process.env.AUTH_EMAIL}>`,
    to: userInfo.email,
    subject: "Reset your password",
    template: "./passwordreset",
    context: {
      name: userInfo.lastname,
      url: `${DOMAIN_NAME}/reset-password/${userInfo._id}/${userInfo.resetToken}`,
    },
  };
  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    throw new ApiError(500, `Error Sending forgot Password Mail ${error}`);
  }
};

export const sendInvoiceMail = async (
  file: { path: string; filename: string },
  email: string,
  user: string,
) => {
  const filePath = file.path;
  const mailOptions = {
    from: user,
    to: email,
    subject: "Invoice",
    text: "Please find the attached PDF.",
    attachments: [
      {
        filename: file.filename,
        href: filePath,
        contentType: "application/pdf",
      },
    ],
  };

  try {
    const emailTransporter = createTransport({
      service: "gmail",
      auth: {
        user: process.env.AUTH_EMAIL,
        pass: process.env.AUTH_PASS,
      },
    });
    await emailTransporter.sendMail(mailOptions);
  } catch (error) {
    throw new ApiError(500, "Error Sending email");
  }
};

export const sendNotificationMail = async (user: IUser, message: string) => {
  const mailOptions = {
    from: `"Amber Training"<${process.env.AUTH_EMAIL}>`,
    to: user.email,
    template: "./notification",
    subject: "New Notification from Amber Training",
    context: {
      name: user.lastname,
      email: user.email,
      message,
    },
  };
  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    throw new ApiError(500, `Error sending notification email:${error}`);
  }
};

//Send Admin notification
export const sendCourseBookingNotification = async (
  adminEmail: string,
  booking: CourseBooking,
) => {
  const mailOptions = {
    from: `"Amber Training" <${process.env.AUTH_EMAIL}>`,
    to: adminEmail,
    subject: "New Course Booking Received",
    template: "./bookcourse",
    context: booking,
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    throw new ApiError(500, `Error sending course booking email: ${error}`);
  }
};

//Send Booking notification for our venue
export const sendOurVeBookingNotification = async (details: CheckoutItem) => {
  const mailOptions = {
    from: `"Amber Training" <${process.env.AUTH_EMAIL}>`,
    to: process.env.AUTH_EMAIL,
    subject: "New Course Booking Received",
    template: "./checkout",
    context: details,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log("after await inside transport");
  } catch (error) {
    throw new ApiError(500, `Error sending course booking email: ${error}`);
  }

  return true;
};

//Send User notification
export const sendCourseBookingConfirmation = async (
  email: string,
  booking: any,
) => {
  const mailOptions = {
    from: `"Amber Training" <${process.env.AUTH_EMAIL}>`,
    to: email,
    subject: "Booking Request Received",
    template: "./coursebookinguser", // refers to coursebookinguser.handlebars
    context: booking,
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    throw new ApiError(
      500,
      `Error sending confirmation email to user: ${error}`,
    );
  }
};

//SendBooking
export const sendBookingApprovalEmail = async (email: string, data: any) => {
  const mailOptions = {
    from: `"Amber Training" <${process.env.AUTH_EMAIL}>`,
    to: email,
    subject: "Your Booking is Approved – Amber Training",
    template: "./coursebookingapproval",
    context: data,
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    throw new ApiError(500, `Error sending booking approval email: ${error}`);
  }
};

// SendUnsubscribe
export const sendUnsubscribeEmail = async (email: string, name: any) => {
  const mailOptions = {
    from: `"Amber Training" <${process.env.AUTH_EMAIL}>`,
    to: process.env.AUTH_EMAIL,
    subject: "Unsubscribe Request",
    template: "./unsubscribe",
    context: { name, email },
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    throw new ApiError(500, `Error sending unsubscribe email: ${error}`);
  }
};
