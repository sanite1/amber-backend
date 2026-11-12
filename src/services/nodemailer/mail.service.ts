import ApiError from "../../errors/apiError";
import transporter from "./nodemailer";
import { REFRESHER_OFFER, poundsText } from "../refresherOffer";

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

// One page the visitor viewed on the visit they enquired from, in order.
export interface PageView {
  path: string;
  at: string;
}

export interface BookingEnquiryPayload {
  companyName: string;
  contactName: string;
  email: string;
  phone?: string;
  courseType: string; // EFAW | FAW | FAW_REQUAL | PFA | BLS | EPFA
  delegates?: string | number;
  preferredDates?: string;
  venueAddress?: string;
  specialRequirements?: string;
  source?: string;
  attribution?: BookingAttribution;
  /** Pages viewed on the visit they booked from, in order. */
  journey?: PageView[];
  /** Reasons the submission looks like spam; empty or absent when clean. */
  spamFlags?: string[];
  /** Refresher offer reference: adds the offer to the client confirmation. */
  offerRef?: string;
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
  if (t === "EPFA") {
    return {
      name: "Emergency Paediatric First Aid",
      price: "£645 per session, all-inclusive",
      meta: "1 day · up to 12 delegates · on-site",
    };
  }
  if (t === "BLS") {
    return {
      name: "CPR, Defibrillator and Anaphylaxis",
      price: "£415 per session, all-inclusive",
      meta: "3 hours · up to 12 delegates · on-site",
    };
  }
  if (t === "FAW_REQUAL") {
    return {
      name: "First Aid at Work Requalification",
      price: "£1,115 per session, all-inclusive",
      meta: "2 days · up to 12 delegates · on-site",
    };
  }
  if (t === "FAW") {
    return {
      name: "First Aid at Work",
      price: "£1,595 per session, all-inclusive",
      meta: "3 days · up to 12 delegates · on-site",
    };
  }
  return {
    name: "Emergency First Aid at Work",
    price: "£645 per session, all-inclusive",
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

// Client-facing date: "flexible" (the form's "To be confirmed") reads as such.
const clientDate = (v?: string) => {
  const s = (v || "").trim();
  return !s || s === "flexible" ? "To be confirmed" : esc(ukDate(s));
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
    On-site first aid training<br/>
    <span style="color:${BRAND.primary};">&bull;</span> <a href="mailto:support@ambertraining.co.uk" style="color:#ffffff;text-decoration:underline;">support@ambertraining.co.uk</a> &nbsp;&nbsp;
    <span style="color:${BRAND.primary};">&bull;</span> +44 7763 658885<br/>
    <span style="color:rgba(255,255,255,0.75);">Based in London. We train teams anywhere in England.</span>
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
// "12:53 /emergency-first-aid-at-work-london" per page, UK time.
const pagesViewed = (journey?: PageView[]) =>
  (journey || [])
    .map((p) => {
      const d = new Date(p.at);
      const time = Number.isNaN(d.getTime())
        ? ""
        : d.toLocaleTimeString("en-GB", {
            timeZone: "Europe/London",
            hour: "2-digit",
            minute: "2-digit",
          });
      return `${time} ${esc(p.path === "/" ? "/ (homepage)" : p.path)}`.trim();
    })
    .join("<br/>");

const attributionBlock = (a?: BookingAttribution, journey?: PageView[]) => {
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
  if (journey?.length)
    rows.push(detailRow("Pages viewed this visit", pagesViewed(journey)));
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

// The refresher offer in the client's booking confirmation: same message as
// the confirmation page, one button to /refresher?ref=... (the reference works
// until 14 days after the course).
const refresherOfferBlock = (ref: string) => {
  const price = poundsText(REFRESHER_OFFER.pricePence);
  const saving = poundsText(
    REFRESHER_OFFER.wasPence - REFRESHER_OFFER.pricePence,
  );
  const href = `${REFRESHER_OFFER.pageUrl}?ref=${encodeURIComponent(ref)}`;
  return `
          <p style="margin:0 0 8px;font-family:${HEAD_FONT};font-size:12px;font-weight:700;color:#C2410C;text-transform:uppercase;letter-spacing:0.08em;">Recommended for your team</p>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #efe9e1;border-radius:8px;margin:0 0 24px;">
            <tr><td style="padding:18px 20px;font-family:${HEAD_FONT};color:${BRAND.secondary};font-size:15px;line-height:1.6;">
              <strong style="font-size:17px;color:#2f3138;">Keep your first aiders ready next year</strong><br/>
              First aid skills fade without practice. The HSE recommends a half-day refresher each year, at your venue.
              <p style="margin:12px 0 14px;"><strong style="font-size:20px;color:#2f3138;">${esc(price)}</strong> <span style="text-decoration:line-through;">${esc(poundsText(REFRESHER_OFFER.wasPence))}</span> <strong style="color:#C2410C;">Save ${esc(saving)}</strong></p>
              ${btn(href, `Add refresher for ${price}`)}
              <p style="margin:12px 0 0;font-size:13px;">Added to your invoice at today's price. Remove it any time before you pay. Available until 14 days after your course.</p>
            </td></tr>
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
      ${attributionBlock(b.attribution, b.journey)}
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
      "Sorry, we could not send your request. Please try again or email support@ambertraining.co.uk.",
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
      subject: "Amber Training: your booking has been received",
      html: emailShell({
        title: "Thank you. Your booking has been received.",
        preheader:
          "Your agreement and invoice will be sent by email within one working day.",
        contentHtml: `
          <p style="margin:0 0 16px;">Dear ${esc(b.contactName)},</p>
          <p style="margin:0 0 20px;">Thank you for booking on-site first aid training for <strong>${esc(b.companyName)}</strong>. Your agreement and invoice will be sent by email <strong>within one working day</strong>. No payment until your booking is confirmed.</p>
          ${courseCard(b.courseType)}
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #efe9e1;border-radius:8px;overflow:hidden;margin:0 0 22px;">
            ${detailRow("Number of delegates", esc(b.delegates) || "To be confirmed")}
            ${detailRow("Preferred date", clientDate(b.preferredDates))}
            ${detailRow("Venue", esc(b.venueAddress) || "To be confirmed")}
          </table>
          ${b.offerRef ? refresherOfferBlock(b.offerRef) : ""}
          <h2 style="margin:0 0 10px;font-family:${HEAD_FONT};color:${BRAND.secondary};font-size:17px;font-weight:700;">What happens next</h2>
          <ol style="margin:0 0 20px;padding-left:20px;">
            <li style="margin:0 0 6px;">We confirm your date and send your agreement and invoice within one working day.</li>
            <li style="margin:0 0 6px;">You sign the agreement and pay the deposit by bank transfer.</li>
            <li style="margin:0;">Our trainer brings all equipment on the day. Certificates are issued by email the next working day.</li>
          </ol>
          <p style="margin:0 0 18px;">Room, equipment and timings for the day are set out in our <a href="https://www.ambertraining.co.uk/preparing-for-your-course" style="color:#C2410C;text-decoration:underline;">guide to preparing for your course</a>.</p>
          <p style="margin:0 0 18px;">For any questions about your booking, reply to this email.</p>
          <p style="margin:0;">Kind regards,<br/><strong>The Amber Training team</strong></p>
        `,
      }),
    });
  } catch (error) {
    console.error("Client confirmation email failed (non-fatal):", error);
  }

  return true;
};

// The client added the annual refresher offer on the confirmation page.
// Subject "Refresher added: {company}" is read by the CRM mail capture
// (contract C1): change both together.
export interface RefresherAddedPayload {
  companyName: string;
  contactName: string;
  email: string;
  courseType: string;
  delegates?: string;
  preferredDates?: string;
}

export const sendRefresherAddedMail = async (r: RefresherAddedPayload) => {
  const price = poundsText(REFRESHER_OFFER.pricePence);
  const was = poundsText(REFRESHER_OFFER.wasPence);
  await transporter.sendMail({
    from: `"Amber Training Bookings" <${process.env.AUTH_EMAIL}>`,
    to: process.env.AUTH_EMAIL,
    replyTo: r.email,
    subject: `Refresher added: ${r.companyName}`,
    html: emailShell({
      title: "Annual refresher added to a booking",
      preheader: `${r.companyName} added the annual refresher at ${price}`,
      contentHtml: `
      <p style="margin:0 0 20px;">The client accepted the refresher offer on the booking confirmation page. Add it to their invoice as a separate line.</p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #efe9e1;border-radius:8px;overflow:hidden;margin:0 0 22px;">
        ${detailRow("Company", esc(r.companyName))}
        ${detailRow("Contact name", esc(r.contactName))}
        ${detailRow("Email", `<a href="mailto:${esc(r.email)}" style="color:${BRAND.primary};">${esc(r.email)}</a>`)}
        ${detailRow("Course booked", esc(courseInfo(r.courseType).name))}
        ${detailRow("Number of delegates", esc(r.delegates) || "Not specified")}
        ${detailRow("Preferred dates", esc(ukDate(r.preferredDates)) || "Flexible")}
        ${detailRow("Add-on", esc(REFRESHER_OFFER.name))}
        ${detailRow("Add-on price", `${esc(price)} (catalogue ${esc(was)})`)}
      </table>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BRAND.cream};border-radius:8px;margin:0 0 8px;">
        <tr><td style="padding:18px 20px;font-family:${HEAD_FONT};color:${BRAND.secondary};font-size:14px;line-height:1.6;">
          <strong>Action needed:</strong> add the refresher line (${esc(price)}) to this client's invoice. It is paid with the course, can be removed any time before payment, and is held about 12 months after the course on a date agreed later.
        </td></tr>
      </table>`,
    }),
  });

  // Best-effort confirmation to the client.
  try {
    await transporter.sendMail({
      from: `"Amber Training" <${process.env.AUTH_EMAIL}>`,
      to: r.email,
      subject: "Amber Training: your annual refresher is added",
      html: emailShell({
        title: "Your annual refresher is added",
        preheader: `It will be on your invoice at ${price}.`,
        contentHtml: `
          <p style="margin:0 0 16px;">Dear ${esc(r.contactName)},</p>
          <p style="margin:0 0 16px;">Thank you. The ${esc(REFRESHER_OFFER.name)} is added to your booking for <strong>${esc(r.companyName)}</strong> at <strong>${esc(price)}</strong>, today's price.</p>
          <p style="margin:0 0 16px;">It will be a separate line on your invoice. It is half a day at your venue, for up to 12 of your staff, about 12 months after your course. We will be in touch nearer the time to agree a date.</p>
          <p style="margin:0 0 18px;">If you would like to remove it, reply to this email any time before you pay the invoice.</p>
          <p style="margin:0;">Kind regards,<br/><strong>The Amber Training team</strong></p>
        `,
      }),
    });
  } catch (error) {
    console.error("Refresher client confirmation failed (non-fatal):", error);
  }
  return true;
};

// Public refresher request form. Subject "Refresher requested: {company}" is
// read by the CRM mail capture (contract C1): change both together.
export interface RefresherRequestPayload {
  companyName: string;
  contactName: string;
  email: string;
  courseDate?: string;
  from?: string;
  spamFlags?: string[];
}

const REQUEST_SOURCES: Record<string, string> = {
  card: "Training-day card",
  certificates: "Certificates email",
};

export const sendRefresherRequestMail = async (r: RefresherRequestPayload) => {
  const price = poundsText(REFRESHER_OFFER.pricePence);
  const was = poundsText(REFRESHER_OFFER.wasPence);
  const source = REQUEST_SOURCES[r.from || ""] || "Website";
  try {
    await transporter.sendMail({
      from: `"Amber Training Bookings" <${process.env.AUTH_EMAIL}>`,
      to: process.env.AUTH_EMAIL,
      replyTo: r.email,
      subject: `${spamPrefix(r.spamFlags)}Refresher requested: ${r.companyName}`,
      html: emailShell({
        title: "Annual refresher requested",
        preheader: `${r.companyName} asked to add the annual refresher at ${price}`,
        contentHtml: `
      ${spamBanner(r.spamFlags)}
      <p style="margin:0 0 20px;">A client asked to add the annual refresher using the refresher form. Find their booking, check the course was within the last 14 days, and add it to their invoice as a separate line.</p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #efe9e1;border-radius:8px;overflow:hidden;margin:0 0 22px;">
        ${detailRow("Company", esc(r.companyName))}
        ${detailRow("Contact name", esc(r.contactName))}
        ${detailRow("Email", `<a href="mailto:${esc(r.email)}" style="color:${BRAND.primary};">${esc(r.email)}</a>`)}
        ${detailRow("Course date", esc(ukDate(r.courseDate)) || "Not given")}
        ${detailRow("Add-on", esc(REFRESHER_OFFER.name))}
        ${detailRow("Add-on price", `${esc(price)} (catalogue ${esc(was)})`)}
        ${detailRow("Source", esc(source))}
      </table>`,
      }),
    });
  } catch (error) {
    console.error("Refresher request email failed:", error);
    throw new ApiError(
      500,
      "Sorry, we could not send your request. Please email support@ambertraining.co.uk.",
    );
  }
  if (r.spamFlags && r.spamFlags.length) return true;
  try {
    await transporter.sendMail({
      from: `"Amber Training" <${process.env.AUTH_EMAIL}>`,
      to: r.email,
      subject: "Amber Training: your refresher request",
      html: emailShell({
        title: "Thank you for your refresher request",
        preheader: `We will add the annual refresher to your booking at ${price}.`,
        contentHtml: `
          <p style="margin:0 0 16px;">Dear ${esc(r.contactName)},</p>
          <p style="margin:0 0 16px;">Thank you. We will add the ${esc(REFRESHER_OFFER.name)} to the booking for <strong>${esc(r.companyName)}</strong> at <strong>${esc(price)}</strong> and confirm by email within one working day.</p>
          <p style="margin:0 0 18px;">It is half a day at your venue, for up to 12 of your staff, about 12 months after your course. We will be in touch nearer the time to agree a date.</p>
          <p style="margin:0;">Kind regards,<br/><strong>The Amber Training team</strong></p>
        `,
      }),
    });
  } catch (error) {
    console.error(
      "Refresher request acknowledgement failed (non-fatal):",
      error,
    );
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
  journey?: PageView[];
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
    ${attributionBlock(enquiry.attribution, enquiry.journey)}
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
      "Sorry, we could not send your enquiry. Please try again or email support@ambertraining.co.uk.",
    );
  }

  return true;
};
