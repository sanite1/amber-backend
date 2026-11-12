// The annual refresher offered on the booking confirmation page (Joey, 12 Nov
// 2026). The CRM catalogue price of First Aid at Work Annual Refresher is
// £415; booked with a course it is £375. The website shows the same figures
// (amber-mvp lib/booking/refresherOffer.ts): change both together.
export const REFRESHER_OFFER = {
  code: "FAW_REFRESHER",
  name: "First Aid at Work Annual Refresher",
  pricePence: 37500,
  wasPence: 41500,
  // Public page that takes the reference (from the confirmation email) or,
  // without one, a short request form (training-day card, certificates email).
  pageUrl: "https://www.ambertraining.co.uk/refresher",
};

const DAY = 24 * 60 * 60 * 1000;

/**
 * Until when a booking's offer reference works: 14 days after the course
 * (the first ISO date in the booking's preferred dates), never less than 7
 * days from booking; 90 days when no date was chosen.
 */
export const offerUntil = (preferredDates: string | undefined, now: Date) => {
  const m = String(preferredDates || "").match(/\d{4}-\d{2}-\d{2}/);
  const course = m ? new Date(`${m[0]}T00:00:00Z`) : null;
  const minimum = now.getTime() + 7 * DAY;
  if (!course || Number.isNaN(course.getTime()))
    return new Date(now.getTime() + 90 * DAY);
  return new Date(Math.max(minimum, course.getTime() + 15 * DAY));
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
