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
  booking: any,
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

// B2B on-site training booking / quote request -> lands in the inbox.
export interface BookingEnquiryPayload {
  companyName: string;
  contactName: string;
  email: string;
  phone?: string;
  courseType: string; // EFAW | FAW
  delegates?: string | number;
  preferredDates?: string;
  venueAddress?: string;
  specialRequirements?: string;
  source?: string;
}

const esc = (v: unknown) =>
  String(v ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

export const sendBookingEnquiryMail = async (b: BookingEnquiryPayload) => {
  const html = `
    <h2>New on-site first aid training booking request</h2>
    <table cellpadding="6" style="border-collapse:collapse;font-family:Arial,sans-serif;">
      <tr><td><strong>Company</strong></td><td>${esc(b.companyName)}</td></tr>
      <tr><td><strong>Contact</strong></td><td>${esc(b.contactName)}</td></tr>
      <tr><td><strong>Email</strong></td><td>${esc(b.email)}</td></tr>
      <tr><td><strong>Phone</strong></td><td>${esc(b.phone) || "Not provided"}</td></tr>
      <tr><td><strong>Course</strong></td><td>${esc(b.courseType)}</td></tr>
      <tr><td><strong>Delegates</strong></td><td>${esc(b.delegates) || "Not specified"}</td></tr>
      <tr><td><strong>Preferred dates</strong></td><td>${esc(b.preferredDates) || "Flexible"}</td></tr>
      <tr><td><strong>Venue address</strong></td><td>${esc(b.venueAddress) || "Not provided"}</td></tr>
      <tr><td valign="top"><strong>Special requirements</strong></td><td>${esc(b.specialRequirements) || "None"}</td></tr>
    </table>
    <hr/>
    <p style="color:#888;font-size:12px;">Sent from ${esc(b.source) || "ambertraining.co.uk"}. Reply to this email to reach the client directly.</p>
  `;

  // 1) Notify the Amber Training inbox.
  try {
    await transporter.sendMail({
      from: `"Amber Training Bookings" <${process.env.AUTH_EMAIL}>`,
      to: process.env.AUTH_EMAIL,
      replyTo: b.email,
      subject: `New ${esc(b.courseType)} booking request – ${esc(b.companyName)}`,
      html,
    });
  } catch (error) {
    throw new ApiError(500, `Error sending booking email: ${error}`);
  }

  // 2) Send the client an instant confirmation (best-effort; do not fail the
  // request if this errors).
  try {
    await transporter.sendMail({
      from: `"Amber Training" <${process.env.AUTH_EMAIL}>`,
      to: b.email,
      subject:
        "We've received your first aid training request – Amber Training",
      html: `
        <p>Hi ${esc(b.contactName)},</p>
        <p>Thank you for your ${esc(b.courseType)} booking request for ${esc(b.companyName)}. We have received your details and will be in touch within 24 hours with your confirmation and invoice. No payment is needed to secure your booking.</p>
        <p>If anything is urgent, call us on +44 7763 658885 or reply to this email.</p>
        <p>Kind regards,<br/>The Amber Training team</p>
      `,
    });
  } catch (error) {
    console.error("Client confirmation email failed (non-fatal):", error);
  }

  return true;
};

// Website enquiry / contact form -> lands in the Amber Training inbox.
export interface EnquiryPayload {
  firstName: string;
  lastName?: string;
  email: string;
  phone?: string;
  message: string;
  courseInterest?: string;
  source?: string;
}

export const sendEnquiryMail = async (enquiry: EnquiryPayload) => {
  const fullName = `${enquiry.firstName} ${enquiry.lastName || ""}`.trim();
  const html = `
    <h2>New website enquiry</h2>
    <p><strong>Name:</strong> ${fullName}</p>
    <p><strong>Email:</strong> ${enquiry.email}</p>
    <p><strong>Phone:</strong> ${enquiry.phone || "Not provided"}</p>
    <p><strong>Course interest:</strong> ${enquiry.courseInterest || "Not specified"}</p>
    <p><strong>Message:</strong></p>
    <p>${(enquiry.message || "").replace(/\n/g, "<br/>")}</p>
    <hr/>
    <p style="color:#888;font-size:12px;">Sent from ${enquiry.source || "ambertraining.co.uk"}</p>
  `;

  const mailOptions = {
    from: `"Amber Training Website" <${process.env.AUTH_EMAIL}>`,
    to: process.env.AUTH_EMAIL,
    replyTo: enquiry.email,
    subject: `New enquiry from ${fullName}${
      enquiry.courseInterest ? ` – ${enquiry.courseInterest}` : ""
    }`,
    html,
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    throw new ApiError(500, `Error sending enquiry email: ${error}`);
  }

  return true;
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
