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
export interface BookingAttribution {
  channel?: string;
  landingPage?: string;
  referrer?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmTerm?: string;
  utmContent?: string;
  gclid?: string;
  firstSeen?: string;
}

export interface BookingEnquiryPayload {
  companyName: string;
  contactName: string;
  email: string;
  phone?: string;
  courseType: string; // EFAW | FAW | PFA
  delegates?: string | number;
  preferredDates?: string;
  venueAddress?: string;
  specialRequirements?: string;
  source?: string;
  attribution?: BookingAttribution;
  /** Reasons the submission looks like spam; empty or absent when clean. */
  spamFlags?: string[];
}

const esc = (v: unknown) =>
  String(v ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

// --- Branded email building blocks (Amber Training brand guide) ---------------
const AMBER_LOGO =
  "https://res.cloudinary.com/dv4uk8qqc/image/upload/v1745396912/Amber_Users/vs3ygjavp7jwjp7gdqws.png";
const BRAND = {
  primary: "#FF7C22",
  primaryDark: "#E86F1E",
  secondary: "#555964",
  cream: "#E1D4BA",
  softOrange: "#fff7f0",
  page: "#f4f4f5",
};
const HEAD_FONT = "'Raleway','Helvetica Neue',Arial,sans-serif";
const BODY_FONT = "'Lora',Georgia,'Times New Roman',serif";

// Client-facing course details. Course names are always written in full (no
// acronyms) and prices match the website: per session, all-inclusive.
const courseInfo = (type: string) => {
  const t = (type || "").toUpperCase().trim();
  if (t === "PFA") {
    return {
      name: "Paediatric First Aid",
      price: "£995 per session, all-inclusive",
      meta: "2 days (12 hours) · up to 12 delegates · on-site",
    };
  }
  if (t === "FAW") {
    return {
      name: "First Aid at Work",
      price: "£1,500 per session, all-inclusive",
      meta: "3 days · up to 12 delegates · on-site",
    };
  }
  return {
    name: "Emergency First Aid at Work",
    price: "£550 per session, all-inclusive",
    meta: "1 day · up to 12 delegates · on-site",
  };
};

// The booking form's date picker sends ISO dates (2026-11-12); show them the
// British way (12 November 2026). Anything else is shown as typed.
const ukDate = (v?: string) => {
  const s = (v || "").trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const d = new Date(`${s}T00:00:00Z`);
  return Number.isNaN(d.getTime())
    ? s
    : d.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
        timeZone: "UTC",
      });
};

// A clean label/value row for the details table.
const detailRow = (label: string, value: string) => `
  <tr>
    <td style="padding:11px 14px;background:#faf7f2;font-family:${HEAD_FONT};font-weight:700;color:${BRAND.secondary};font-size:14px;border-bottom:1px solid #efe9e1;width:42%;vertical-align:top;">${label}</td>
    <td style="padding:11px 14px;font-family:${BODY_FONT};color:${BRAND.secondary};font-size:14px;border-bottom:1px solid #efe9e1;vertical-align:top;">${value}</td>
  </tr>`;

const courseCard = (type: string) => {
  const c = courseInfo(type);
  return `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BRAND.softOrange};border-left:4px solid ${BRAND.primary};border-radius:8px;margin:0 0 22px;">
    <tr><td style="padding:16px 18px;">
      <div style="font-family:${HEAD_FONT};font-size:11px;text-transform:uppercase;letter-spacing:1.5px;color:${BRAND.primary};font-weight:700;">Course requested</div>
      <div style="font-family:${HEAD_FONT};font-size:18px;font-weight:700;color:${BRAND.secondary};margin-top:5px;">${esc(c.name)}</div>
      <div style="font-family:${BODY_FONT};color:${BRAND.secondary};margin-top:3px;font-size:14px;">${esc(c.price)} · ${esc(c.meta)}</div>
    </td></tr>
  </table>`;
};

// Wraps content in the branded email shell (logo header, orange accent, footer).
const emailShell = (opts: {
  title: string;
  preheader?: string;
  contentHtml: string;
}) => `<!DOCTYPE html>
<html lang="en"><head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1.0"/>
<style>@import url('https://fonts.googleapis.com/css2?family=Lora:wght@400;600&family=Raleway:wght@400;600;700&display=swap');</style>
</head>
<body style="margin:0;padding:0;background:${BRAND.page};">
<span style="display:none;max-height:0;overflow:hidden;font-size:1px;line-height:1px;color:${BRAND.page};">${esc(opts.preheader || "")}</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BRAND.page};padding:24px 12px;">
<tr><td align="center">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 18px rgba(85,89,100,0.12);">
  <tr><td align="center" style="padding:28px 24px 18px;background:#ffffff;">
    <img src="${AMBER_LOGO}" alt="Amber Training" width="170" style="max-width:170px;height:auto;display:block;border:0;"/>
  </td></tr>
  <tr><td style="height:4px;background:${BRAND.primary};line-height:4px;font-size:0;">&nbsp;</td></tr>
  <tr><td style="padding:30px 32px;font-family:${BODY_FONT};color:${BRAND.secondary};font-size:16px;line-height:1.65;">
    <h1 style="margin:0 0 18px;font-family:${HEAD_FONT};color:${BRAND.secondary};font-size:22px;font-weight:700;line-height:1.3;">${esc(opts.title)}</h1>
    ${opts.contentHtml}
  </td></tr>
  <tr><td style="background:${BRAND.secondary};padding:24px 32px;font-family:${HEAD_FONT};color:#ffffff;font-size:13px;line-height:1.7;">
    <strong style="color:#ffffff;font-size:15px;">Amber Training</strong><br/>
    On-site first aid training for London businesses<br/>
    <span style="color:${BRAND.primary};">&bull;</span> +44 7763 658885 &nbsp;&nbsp;
    <span style="color:${BRAND.primary};">&bull;</span> <a href="mailto:support@ambertraining.co.uk" style="color:#ffffff;text-decoration:underline;">support@ambertraining.co.uk</a><br/>
    <span style="color:rgba(255,255,255,0.75);">Based in North London, delivering across London, the surrounding counties and throughout England</span>
  </td></tr>
</table>
</td></tr>
</table>
</body></html>`;

const btn = (href: string, label: string) =>
  `<a href="${esc(href)}" style="display:inline-block;background:${BRAND.primary};color:#ffffff;text-decoration:none;font-weight:700;font-family:${HEAD_FONT};padding:13px 24px;border-radius:8px;font-size:15px;">${esc(label)}</a>`;

// Shown at the top of an inbox email when the submission looks like spam, so
// it can be skimmed and deleted. Flagged senders get no confirmation email.
const spamBanner = (flags?: string[]) =>
  flags && flags.length
    ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#fdecea;border:1px solid #f5c2c0;border-radius:8px;margin:0 0 20px;"><tr><td style="padding:14px 18px;font-family:${HEAD_FONT};color:#8a1f17;font-size:14px;line-height:1.5;"><strong>Possible spam:</strong> ${esc(flags.join(", "))}. No confirmation was sent to the sender.</td></tr></table>`
    : "";
const spamPrefix = (flags?: string[]) =>
  flags && flags.length ? "[Possible spam] " : "";

// "How they found us": first-touch attribution captured on the website and
// shown with every enquiry so ads and organic bookings are told apart at a
// glance. Only the fields that exist are rendered; older or no-JS enquiries
// show an honest "not captured" line instead.
const attributionBlock = (a?: BookingAttribution) => {
  const rows: string[] = [];
  if (a?.channel)
    rows.push(detailRow("Channel", `<strong>${esc(a.channel)}</strong>`));
  if (a?.utmCampaign) rows.push(detailRow("Campaign", esc(a.utmCampaign)));
  if (a?.utmSource || a?.utmMedium)
    rows.push(
      detailRow(
        "Source / medium",
        esc([a?.utmSource, a?.utmMedium].filter(Boolean).join(" / ")),
      ),
    );
  if (a?.gclid) rows.push(detailRow("Google Ads click ID", "Present"));
  if (a?.landingPage)
    rows.push(detailRow("First landed on", esc(a.landingPage)));
  if (a?.referrer) rows.push(detailRow("Referrer", esc(a.referrer)));
  if (a?.firstSeen) {
    const d = new Date(a.firstSeen);
    if (!Number.isNaN(d.getTime()))
      rows.push(
        detailRow(
          "First visit",
          d.toLocaleString("en-GB", { timeZone: "Europe/London" }),
        ),
      );
  }
  const inner = rows.length
    ? rows.join("")
    : detailRow("Channel", "Not captured (JavaScript off or storage blocked)");
  return `
      <p style="margin:0 0 8px;font-family:${HEAD_FONT};font-size:13px;font-weight:700;color:${BRAND.secondary};text-transform:uppercase;letter-spacing:0.06em;">How they found us</p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #efe9e1;border-radius:8px;overflow:hidden;margin:0 0 22px;">
        ${inner}
      </table>`;
};

export const sendBookingEnquiryMail = async (b: BookingEnquiryPayload) => {
  const flagged = Boolean(b.spamFlags && b.spamFlags.length);
  const replyHref = `mailto:${b.email}?subject=${encodeURIComponent(
    `Your ${courseInfo(b.courseType).name} booking with Amber Training`,
  )}`;
  const html = emailShell({
    title: "New on-site first aid training booking request",
    preheader: `${b.companyName} requested ${courseInfo(b.courseType).name} training`,
    contentHtml: `
      ${spamBanner(b.spamFlags)}
      <p style="margin:0 0 20px;">A new booking enquiry has just come in through ambertraining.co.uk. The details are below.</p>
      ${courseCard(b.courseType)}
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #efe9e1;border-radius:8px;overflow:hidden;margin:0 0 22px;">
        ${detailRow("Company", esc(b.companyName))}
        ${detailRow("Contact name", esc(b.contactName))}
        ${detailRow("Email", `<a href="mailto:${esc(b.email)}" style="color:${BRAND.primary};">${esc(b.email)}</a>`)}
        ${detailRow("Phone", esc(b.phone) || "Not provided")}
        ${detailRow("Number of delegates", esc(b.delegates) || "Not specified")}
        ${detailRow("Preferred dates", esc(ukDate(b.preferredDates)) || "Flexible")}
        ${detailRow("Venue address", esc(b.venueAddress) || "Not provided")}
        ${detailRow("Special requirements", esc(b.specialRequirements) || "None")}
      </table>
      ${attributionBlock(b.attribution)}
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BRAND.cream};border-radius:8px;margin:0 0 8px;">
        <tr><td style="padding:18px 20px;font-family:${HEAD_FONT};color:${BRAND.secondary};font-size:14px;line-height:1.6;">
          <strong>Action needed:</strong> reply to the client within 24 hours with their confirmation and invoice. No payment is taken at booking.
          <div style="margin-top:16px;">${btn(replyHref, `Reply to ${b.contactName}`)}</div>
        </td></tr>
      </table>
      <p style="font-family:${HEAD_FONT};font-size:12px;color:#999999;margin:18px 0 0;">Sent from ${esc(b.source) || "ambertraining.co.uk"}. You can reply directly to this email to reach the client.</p>
    `,
  });

  // 1) Notify the Amber Training inbox.
  try {
    await transporter.sendMail({
      from: `"Amber Training Bookings" <${process.env.AUTH_EMAIL}>`,
      to: process.env.AUTH_EMAIL,
      replyTo: b.email,
      // Plain text, so no HTML escaping (nodemailer strips line breaks).
      subject: `${spamPrefix(b.spamFlags)}New ${courseInfo(b.courseType).name} booking request: ${b.companyName}`,
      html,
    });
  } catch (error) {
    console.error("Booking notification email failed:", error);
    throw new ApiError(
      500,
      "Sorry, we could not send your request. Please email support@ambertraining.co.uk or call +44 7763 658885.",
    );
  }

  // 2) Send the client an instant confirmation (best-effort; do not fail the
  // request if this errors). Never for a submission flagged as possible spam,
  // so bots cannot use this to send mail to third parties.
  if (flagged) return true;
  try {
    await transporter.sendMail({
      from: `"Amber Training" <${process.env.AUTH_EMAIL}>`,
      to: b.email,
      subject: "Amber Training: we've received your first aid training request",
      html: emailShell({
        title: "Thank you, we've received your request",
        preheader:
          "We'll be in touch within 24 hours with your confirmation and invoice.",
        contentHtml: `
          <p style="margin:0 0 16px;">Hi ${esc(b.contactName)},</p>
          <p style="margin:0 0 20px;">Thank you for your enquiry. We've received your request for on-site first aid training for <strong>${esc(b.companyName)}</strong>, and one of our team will be in touch <strong>within 24 hours</strong> with your confirmation and invoice. There is no payment needed to secure your booking.</p>
          ${courseCard(b.courseType)}
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #efe9e1;border-radius:8px;overflow:hidden;margin:0 0 22px;">
            ${detailRow("Number of delegates", esc(b.delegates) || "To be confirmed")}
            ${detailRow("Preferred dates", esc(ukDate(b.preferredDates)) || "To be confirmed")}
            ${detailRow("Venue", esc(b.venueAddress) || "To be confirmed")}
          </table>
          <p style="margin:0 0 18px;">If anything is urgent, just call us on <strong>+44 7763 658885</strong> or reply to this email and we will be glad to help.</p>
          <p style="margin:0;">Kind regards,<br/><strong>The Amber Training team</strong></p>
        `,
      }),
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
  attribution?: BookingAttribution;
  spamFlags?: string[];
}

export const sendEnquiryMail = async (enquiry: EnquiryPayload) => {
  const fullName = `${enquiry.firstName} ${enquiry.lastName || ""}`.trim();
  // Visitor-typed values are escaped so nothing they enter renders as HTML
  // (links, images) in the inbox.
  const html = `
    ${spamBanner(enquiry.spamFlags)}
    <h2>New website enquiry</h2>
    <p><strong>Name:</strong> ${esc(fullName)}</p>
    <p><strong>Email:</strong> ${esc(enquiry.email)}</p>
    <p><strong>Phone:</strong> ${esc(enquiry.phone || "Not provided")}</p>
    <p><strong>Course interest:</strong> ${esc(enquiry.courseInterest || "Not specified")}</p>
    <p><strong>Message:</strong></p>
    <p>${esc(enquiry.message || "").replace(/\n/g, "<br/>")}</p>
    ${attributionBlock(enquiry.attribution)}
    <hr/>
    <p style="color:#888;font-size:12px;">Sent from ${esc(enquiry.source || "ambertraining.co.uk")}</p>
  `;

  const mailOptions = {
    from: `"Amber Training Website" <${process.env.AUTH_EMAIL}>`,
    to: process.env.AUTH_EMAIL,
    replyTo: enquiry.email,
    subject: `${spamPrefix(enquiry.spamFlags)}New enquiry from ${fullName}${
      enquiry.courseInterest ? `: ${enquiry.courseInterest}` : ""
    }`,
    html,
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error("Enquiry notification email failed:", error);
    throw new ApiError(
      500,
      "Sorry, we could not send your enquiry. Please email support@ambertraining.co.uk or call +44 7763 658885.",
    );
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
