// The annual refresher offered on the booking confirmation page (Joey, 12 Nov
// 2026). The CRM catalogue price of First Aid at Work Annual Refresher is
// £415; booked with a course it is £375. The website shows the same figures
// (amber-mvp lib/booking/refresherOffer.ts): change both together.
export const REFRESHER_OFFER = {
  code: "FAW_REFRESHER",
  name: "First Aid at Work Annual Refresher",
  pricePence: 37500,
  wasPence: 41500,
  // The confirmation page offers it straight after booking; the reference
  // stops working after 7 days.
  webWindowMs: 7 * 24 * 60 * 60 * 1000,
};

// Workplace courses only: the refresher keeps First Aid at Work and
// Emergency First Aid at Work skills current between certificates.
const ELIGIBLE = ["EFAW", "FAW", "FAW_REQUAL"];

export const refresherEligible = (courseType: string) =>
  ELIGIBLE.includes(String(courseType || "").toUpperCase());

export const poundsText = (pence: number) =>
  `£${(pence / 100).toLocaleString("en-GB", {
    minimumFractionDigits: pence % 100 ? 2 : 0,
  })}`;
