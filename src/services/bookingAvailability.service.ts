import ical from "node-ical";
import moment from "moment-timezone";
import BookingAvailabilityCache from "../models/BookingAvailabilityCache";

// Read-only availability from Joey's Google Calendar iCal feed.
//
// Rules (per the availability brief):
// - Any non-cancelled event on a date makes that whole date unavailable,
//   regardless of title, attendees, duration or free/busy transparency.
//   All-day and timed events both count. Courses are full-day.
// - Lookahead is 6 months from today, Europe/London calendar dates.
// - The feed URL is a secret: env var only, never logged, never returned.
// - The public payload is ONLY a list of YYYY-MM-DD strings.
//
// Freshness: refreshUnavailableDates() is called by a 15-minute node-cron job
// (fully effective in a long-lived process, opportunistic on Vercel where
// lambdas are ephemeral) AND lazily by getUnavailableDates() whenever the
// cached copy is older than the TTL, which guarantees visitors never read a
// cache more than 15 minutes stale even on serverless.
//
// Failure policy: FAIL OPEN. If the feed is unreachable we serve the last
// good cache whatever its age, and with no cache at all we serve an empty
// list (every date selectable). Rationale: this is an enquiry form, not a
// payment; a clashing enquiry costs Joey one reply email, whereas a closed
// calendar costs bookings.

const TIMEZONE = "Europe/London";
const CACHE_KEY = "google-calendar-busy-dates";
const CACHE_TTL_MS = 15 * 60 * 1000;
const LOOKAHEAD_MONTHS = 6;
const FETCH_TIMEOUT_MS = 10_000;
// Safety cap when walking one event's day span, so a malformed multi-year
// event cannot spin the parser. Far beyond any real course booking.
const MAX_SPAN_DAYS = 400;

export const availabilityRange = () => {
  const from = moment.tz(TIMEZONE).startOf("day");
  const to = from.clone().add(LOOKAHEAD_MONTHS, "months").endOf("day");
  return { from, to };
};

async function fetchIcsText(url: string): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      redirect: "follow",
    });
    if (!res.ok) {
      throw new Error(`iCal feed responded with HTTP ${res.status}`);
    }
    return await res.text();
  } catch (err) {
    // Re-wrap so the secret URL can never surface through an error message.
    if (err instanceof Error && err.name === "AbortError") {
      throw new Error("iCal feed fetch timed out");
    }
    throw new Error(
      `iCal feed fetch failed: ${err instanceof Error ? err.message : "unknown error"}`,
    );
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Expand the parsed feed into the set of busy YYYY-MM-DD dates inside the
 * lookahead window. Recurring events are expanded via their RRULE; EXDATEs
 * are skipped; recurrence overrides are honoured on their moved dates.
 * Where an edge case is ambiguous we prefer marking a date busy: the safe
 * failure here is a lost slot, never a double booking.
 */
export function collectBusyDates(icsText: string): string[] {
  const { from, to } = availabilityRange();
  const fromYmd = from.format("YYYY-MM-DD");
  const toYmd = to.format("YYYY-MM-DD");
  const rangeEnd = to.toDate();
  const busy = new Set<string>();

  const addDay = (ymd: string) => {
    if (ymd >= fromYmd && ymd <= toYmd) busy.add(ymd);
  };

  const addSpan = (
    start: Date | undefined,
    end: Date | null | undefined,
    dateOnly: boolean,
  ) => {
    if (!start) return;
    if (dateOnly) {
      // node-ical parses VALUE=DATE fields to midnight in the server's local
      // timezone, so the local date parts ARE the calendar date as written
      // in the feed. DTEND on all-day events is exclusive.
      const first = moment(start).startOf("day");
      let last = end
        ? moment(end).startOf("day").subtract(1, "day")
        : first.clone();
      if (last.isBefore(first)) last = first.clone();
      const d = first.clone();
      for (let i = 0; !d.isAfter(last) && i < MAX_SPAN_DAYS; i++) {
        addDay(d.format("YYYY-MM-DD"));
        d.add(1, "day");
      }
    } else {
      // Timed events: map the absolute instants to London calendar dates.
      // An event ending exactly at midnight does not block the next day.
      const first = moment.tz(start, TIMEZONE).startOf("day");
      let endM = end ? moment.tz(end, TIMEZONE) : moment.tz(start, TIMEZONE);
      if (
        endM.isAfter(moment.tz(start, TIMEZONE)) &&
        endM.isSame(endM.clone().startOf("day"))
      ) {
        endM = endM.clone().subtract(1, "millisecond");
      }
      const last = endM.startOf("day");
      const d = first.clone();
      for (let i = 0; !d.isAfter(last) && i < MAX_SPAN_DAYS; i++) {
        addDay(d.format("YYYY-MM-DD"));
        d.add(1, "day");
      }
    }
  };

  const parsed = ical.sync.parseICS(icsText);

  for (const key of Object.keys(parsed)) {
    // node-ical's own types for event internals are loose; treat as any and
    // guard each field.
    const item = parsed[key] as any;
    if (!item || item.type !== "VEVENT") continue;
    if (item.status === "CANCELLED") continue;

    const dateOnly = item.datetype === "date";

    if (item.rrule && item.start) {
      const durationMs =
        item.end && item.start
          ? Math.max(item.end.getTime() - item.start.getTime(), 0)
          : 0;
      // Pad the search window backwards so a multi-day occurrence that starts
      // just before the range but overlaps into it is still counted.
      const searchStart = new Date(
        from.toDate().getTime() - durationMs - 24 * 60 * 60 * 1000,
      );
      const occurrences: Date[] = item.rrule.between(
        searchStart,
        rangeEnd,
        true,
      );

      const exdateInstants = new Set<number>();
      if (item.exdate) {
        for (const ex of Object.values(item.exdate) as Date[]) {
          const t = new Date(ex as any).getTime();
          if (!Number.isNaN(t)) exdateInstants.add(t);
        }
      }
      // Instances replaced by an override are handled from item.recurrences
      // below; skip their original slots here.
      const overriddenKeys = new Set<string>(
        item.recurrences ? Object.keys(item.recurrences) : [],
      );

      for (const occ of occurrences) {
        if (exdateInstants.has(occ.getTime())) continue;
        const occYmd = moment(occ).format("YYYY-MM-DD");
        if (overriddenKeys.has(occYmd)) continue;
        addSpan(occ, new Date(occ.getTime() + durationMs), dateOnly);
      }
    } else {
      addSpan(item.start, item.end, dateOnly);
    }

    if (item.recurrences) {
      for (const override of Object.values(item.recurrences) as any[]) {
        if (!override || override.status === "CANCELLED") continue;
        addSpan(override.start, override.end, override.datetype === "date");
      }
    }
  }

  return Array.from(busy).sort();
}

/** Fetch the feed, parse it, and store the busy-date set in the cache. */
export const refreshUnavailableDates = async (): Promise<string[]> => {
  const url = process.env.GOOGLE_CALENDAR_ICAL_URL;
  if (!url) {
    throw new Error("GOOGLE_CALENDAR_ICAL_URL is not set");
  }
  const icsText = await fetchIcsText(url);
  const dates = collectBusyDates(icsText);
  await BookingAvailabilityCache.findOneAndUpdate(
    { key: CACHE_KEY },
    { key: CACHE_KEY, dates, fetchedAt: new Date() },
    { upsert: true },
  );
  console.log(`booking-availability: cached ${dates.length} unavailable dates`);
  return dates;
};

/**
 * Read path used by the public endpoint. Serves the cache when it is fresher
 * than 15 minutes; otherwise refreshes inline. Fails open: on refresh failure
 * it serves the stale cache, and with no cache at all an empty list.
 */
export const getUnavailableDates = async (): Promise<{
  dates: string[];
  updatedAt: Date | null;
}> => {
  const doc = await BookingAvailabilityCache.findOne({
    key: CACHE_KEY,
  }).lean();

  if (doc && Date.now() - new Date(doc.fetchedAt).getTime() < CACHE_TTL_MS) {
    return { dates: doc.dates, updatedAt: doc.fetchedAt };
  }

  try {
    const dates = await refreshUnavailableDates();
    return { dates, updatedAt: new Date() };
  } catch (err) {
    console.error(
      "booking-availability: refresh failed, serving",
      doc ? "stale cache" : "empty list",
      "-",
      err instanceof Error ? err.message : err,
    );
    if (doc) return { dates: doc.dates, updatedAt: doc.fetchedAt };
    return { dates: [], updatedAt: null };
  }
};
