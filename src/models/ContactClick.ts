import { Schema, model } from "mongoose";

// One document per click on the website's email link (mailto:support@) or a
// phone link, so an enquiry that arrives by email can be matched by time to
// how the sender reached the website. Only allow-listed values are stored:
// the minute of the click, the kind of link, the channel code, the page the
// visitor first landed on and the page the click happened on. Deliberately
// nothing about the visitor: no IP address, user agent, cookie, referrer URL
// or any other identifier.
const ContactClickSchema = new Schema({
  // The click time, cut to the minute (seconds and milliseconds are zero).
  at: { type: Date, required: true, index: true },
  // The same minute in Europe/London, "YYYY-MM-DD HH:mm", for reading.
  london: { type: String, required: true },
  // "email" or "phone".
  kind: { type: String, required: true },
  // A channel code such as "google_organic", "bing_organic", "chatgpt",
  // "google_business_profile" or "direct"; "unknown" without consent (the
  // list is CHANNELS in services/contactClickMetrics.service.ts).
  channel: { type: String, required: true },
  // Page slug the visitor first landed on ("" when not known).
  landing: { type: String, default: "" },
  // Page slug the click happened on.
  from: { type: String, required: true },
  // Kept for about 13 months, then deleted by MongoDB (TTL index).
  createdAt: { type: Date, default: Date.now, expires: 60 * 60 * 24 * 400 },
});

const ContactClick = model("ContactClick", ContactClickSchema);

export default ContactClick;
