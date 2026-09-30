import { Schema, model } from "mongoose";

// Durable log of every booking enquiry that was successfully emailed to the
// inbox, together with its first-touch attribution (ads / organic / referral
// / direct). This is the scannable record of how bookings arrive: the inbox
// answers "who enquired", this collection answers "and where they came from"
// in a form that can be queried and aggregated later. Written best-effort:
// a logging failure never blocks or fails the enquiry itself.
// Contact form enquiries are logged here too with kind "contact"; booking
// records have no kind (or "booking").
const BookingEnquiryLogSchema = new Schema(
  {
    kind: { type: String },
    courseInterest: { type: String },
    message: { type: String },
    companyName: { type: String },
    contactName: { type: String },
    email: { type: String },
    phone: { type: String },
    courseType: { type: String },
    delegates: { type: String },
    preferredDates: { type: String },
    venueAddress: { type: String },
    specialRequirements: { type: String },
    source: { type: String },
    // Reasons the submission looked like spam (empty when clean), and how
    // long the visitor took to fill the form, when the website sent it.
    spamFlags: { type: [String], default: undefined },
    fillMs: { type: Number },
    attribution: {
      channel: { type: String },
      landingPage: { type: String },
      referrer: { type: String },
      utmSource: { type: String },
      utmMedium: { type: String },
      utmCampaign: { type: String },
      utmTerm: { type: String },
      utmContent: { type: String },
      gclid: { type: String },
      firstSeen: { type: String },
    },
  },
  { timestamps: true },
);

const BookingEnquiryLog = model("BookingEnquiryLog", BookingEnquiryLogSchema);

export default BookingEnquiryLog;
