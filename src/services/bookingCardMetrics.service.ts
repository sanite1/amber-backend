import { Request } from "express";
import { createHash, timingSafeEqual } from "crypto";
import moment from "moment-timezone";
import BookingCardCount from "../models/BookingCardCount";
import RateLimitHit from "../models/RateLimitHit";

// Booking-card counts sent by the website (navigator.sendBeacon). Every field
// must be one of a short list of known values, so nothing a visitor types and
// nothing that identifies them can reach the database.

const TIMEZONE = "Europe/London";

export const EVENTS = ["start", "submit"] as const;
export const COURSES = ["efaw", "faw", "faw_requal"] as const;
export const PEOPLE = ["1-4", "5-8", "9-12", "13+"] as const;
// Page slugs as the website names them ("home", "course-faw_requal",
// "area-enfield"): lower-case letters, digits, hyphens and underscores.
const FROM_PATTERN = /^[a-z0-9][a-z0-9_-]*$/;
const FROM_MAX = 80;

export type BookingCardEvent = {
  event: (typeof EVENTS)[number];
  from: string;
  course: (typeof COURSES)[number];
  people: (typeof PEOPLE)[number] | "";
};

const oneOf = <T extends string>(list: readonly T[], v: unknown): v is T =>
  typeof v === "string" && (list as readonly string[]).includes(v);

/**
 * Read a beacon body. sendBeacon posts text/plain, so the body arrives as a
 * string of JSON; a JSON request arrives already parsed. Returns null for
 * anything that is not exactly a valid booking-card event.
 */
export const parseBookingCardEvent = (
  raw: unknown,
): BookingCardEvent | null => {
  let body: unknown = raw;
  if (typeof raw === "string") {
    try {
      body = JSON.parse(raw);
    } catch {
      return null;
    }
  }
  if (!body || typeof body !== "object" || Array.isArray(body)) return null;
  const { event, from, course, people } = body as Record<string, unknown>;

  if (!oneOf(EVENTS, event)) return null;
  if (!oneOf(COURSES, course)) return null;
  if (
    typeof from !== "string" ||
    from.length > FROM_MAX ||
    !FROM_PATTERN.test(from)
  )
    return null;

  // A start is counted before the team size is chosen; a submit always has it.
  let band: BookingCardEvent["people"] = "";
  if (event === "submit") {
    if (!oneOf(PEOPLE, people)) return null;
    band = people;
  } else if (people !== undefined && people !== "") {
    if (!oneOf(PEOPLE, people)) return null;
    band = people;
  }

  return { event, from, course, people: band };
};

/** Today's date in Europe/London, as YYYY-MM-DD. */
export const londonDay = (at?: Date) =>
  moment.tz(at ?? new Date(), TIMEZONE).format("YYYY-MM-DD");

/** Add one to the day's counter for this combination. */
export const recordBookingCardEvent = async (e: BookingCardEvent) => {
  const filter = { day: londonDay(), ...e };
  const update = { $inc: { count: 1 } };
  try {
    await BookingCardCount.updateOne(filter, update, { upsert: true });
  } catch (error) {
    // Two first hits of the same counter at once: one upsert wins the insert
    // and the other hits the unique index. The document now exists, so retry.
    if ((error as { code?: number })?.code === 11000) {
      await BookingCardCount.updateOne(filter, update, { upsert: true });
    } else {
      throw error;
    }
  }
};

// Rate limiting. The form limiter (spamGuard checkRateLimit) keeps client IPs
// in RateLimitHit for an hour, which this count promises never to store. So:
// a per-IP limit held only in this instance's memory (never written
// anywhere), and an overall hourly ceiling in RateLimitHit under one fixed key
// with no visitor data in it. Real use is a handful of events an hour.
const IP_WINDOW_MS = 10 * 60 * 1000;
const IP_LIMIT = 30;
const GLOBAL_KEY = "metrics:booking-card";
const GLOBAL_LIMIT_PER_HOUR = 1000;
const ipHits = new Map<string, { count: number; resetAt: number }>();

const connectingIp = (req: Request) =>
  String(req.headers["x-forwarded-for"] || req.socket.remoteAddress || "")
    .split(",")[0]
    .trim();

/** True when this event should be counted. Fails open on database errors. */
export const allowBookingCardEvent = async (req: Request) => {
  const now = Date.now();
  const ip = connectingIp(req);
  if (ip) {
    if (ipHits.size > 5000) {
      for (const [k, v] of ipHits) if (v.resetAt <= now) ipHits.delete(k);
      if (ipHits.size > 5000) ipHits.clear();
    }
    const hit = ipHits.get(ip);
    if (!hit || hit.resetAt <= now) {
      ipHits.set(ip, { count: 1, resetAt: now + IP_WINDOW_MS });
    } else if (++hit.count > IP_LIMIT) {
      return false;
    }
  }
  try {
    const count = await RateLimitHit.countDocuments({ key: GLOBAL_KEY });
    if (count >= GLOBAL_LIMIT_PER_HOUR) return false;
    await RateLimitHit.create({ key: GLOBAL_KEY });
  } catch (error) {
    console.error(
      "booking-card rate limit check failed (allowing):",
      error instanceof Error ? error.message : error,
    );
  }
  return true;
};

/**
 * SHA-256 of the summary key. Only the hash is committed: the key itself is
 * kept privately by Amber (on Joey's Mac), because the Vercel environment is
 * not editable by us. A hash cannot be turned back into the key.
 */
const METRICS_READ_KEY_SHA256 =
  "93c30ceef670dcacbd76708a041e6eec1114a458a137386478e2cb5b8c5bee6e";

/**
 * Check the secret header for the summary. The env var METRICS_READ_KEY, when
 * set, takes precedence; otherwise the key must match the committed hash.
 */
export const hasMetricsKey = (provided: unknown) => {
  if (typeof provided !== "string" || !provided) return false;
  const digest = (s: string) => createHash("sha256").update(s).digest();
  const fromEnv = process.env.METRICS_READ_KEY;
  if (fromEnv) return timingSafeEqual(digest(provided), digest(fromEnv));
  return timingSafeEqual(
    digest(provided),
    Buffer.from(METRICS_READ_KEY_SHA256, "hex"),
  );
};

type Pair = { start: number; submit: number };
const emptyPair = (): Pair => ({ start: 0, submit: 0 });

/** Totals over the last `days` days (today included), London dates. */
export const summariseBookingCard = async (days: number) => {
  const toDay = londonDay();
  const fromDay = moment
    .tz(TIMEZONE)
    .subtract(days - 1, "days")
    .format("YYYY-MM-DD");

  const rows = await BookingCardCount.find(
    { day: { $gte: fromDay, $lte: toDay } },
    { _id: 0, day: 1, event: 1, from: 1, course: 1, people: 1, count: 1 },
  ).lean();

  const totals = emptyPair();
  const byCourse: Record<string, Pair> = {};
  const byFrom: Record<string, Pair> = {};
  const byPeople: Record<string, number> = {};
  for (const r of rows) {
    const ev = r.event as keyof Pair;
    if (ev !== "start" && ev !== "submit") continue;
    const n = r.count ?? 0;
    totals[ev] += n;
    (byCourse[r.course] ??= emptyPair())[ev] += n;
    (byFrom[r.from] ??= emptyPair())[ev] += n;
    if (ev === "submit" && r.people)
      byPeople[r.people] = (byPeople[r.people] ?? 0) + n;
  }

  return { days, fromDay, toDay, totals, byCourse, byFrom, byPeople };
};
