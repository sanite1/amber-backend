import { Request } from "express";
import moment from "moment-timezone";
import ContactClick from "../models/ContactClick";
import RateLimitHit from "../models/RateLimitHit";

// Clicks on the website's email link (mailto:support@) and phone links, sent
// by the website with navigator.sendBeacon. Someone who emails support@ from
// a website link leaves no form behind, so the CRM cannot tell how they found
// us; these records let an emailed enquiry be matched by time to a click.
// Every field must be one of a short list of known values, so nothing a
// visitor types and nothing that identifies them can reach the database.

const TIMEZONE = "Europe/London";

export const KINDS = ["email", "phone"] as const;
// The website's channel codes (amber-mvp lib/attribution.ts channelCode).
// "unknown" means the visitor had not allowed analytics storage, so the
// website did not send their source.
export const CHANNELS = [
  "google_ads",
  "microsoft_ads",
  "google_organic",
  "bing_organic",
  "other_search",
  "google_business_profile",
  "bing_places",
  "chatgpt",
  "gemini",
  "perplexity",
  "copilot",
  "claude",
  "ai_other",
  "campaign",
  "referral",
  "direct",
  "lost",
  "unknown",
] as const;
// Page slugs as the website names them ("home", "contact",
// "first-aid-at-work-london"): lower-case letters, digits, hyphens and
// underscores.
const SLUG_PATTERN = /^[a-z0-9][a-z0-9_-]*$/;
const SLUG_MAX = 80;

export type ContactClickEvent = {
  kind: (typeof KINDS)[number];
  channel: (typeof CHANNELS)[number];
  /** First page of the visit, "" when the website did not send it. */
  landing: string;
  /** Page the link was clicked on. */
  from: string;
};

const oneOf = <T extends string>(list: readonly T[], v: unknown): v is T =>
  typeof v === "string" && (list as readonly string[]).includes(v);

const isSlug = (v: unknown): v is string =>
  typeof v === "string" && v.length <= SLUG_MAX && SLUG_PATTERN.test(v);

/**
 * Read a beacon body (a text/plain string of JSON, or JSON already parsed).
 * Returns null for anything that is not exactly a valid contact click.
 */
export const parseContactClick = (raw: unknown): ContactClickEvent | null => {
  let body: unknown = raw;
  if (typeof raw === "string") {
    try {
      body = JSON.parse(raw);
    } catch {
      return null;
    }
  }
  if (!body || typeof body !== "object" || Array.isArray(body)) return null;
  const { kind, channel, landing, from } = body as Record<string, unknown>;

  if (!oneOf(KINDS, kind)) return null;
  if (!oneOf(CHANNELS, channel)) return null;
  if (!isSlug(from)) return null;
  let first = "";
  if (landing !== undefined && landing !== "") {
    if (!isSlug(landing)) return null;
    first = landing;
  }
  return { kind, channel, landing: first, from };
};

/** The minute of a time: seconds and milliseconds set to zero. */
export const toMinute = (at: Date) =>
  new Date(Math.floor(at.getTime() / 60000) * 60000);

/** Save one click, at minute resolution. */
export const recordContactClick = async (
  e: ContactClickEvent,
  now: Date = new Date(),
) => {
  const at = toMinute(now);
  await ContactClick.create({
    at,
    london: moment.tz(at, TIMEZONE).format("YYYY-MM-DD HH:mm"),
    ...e,
  });
};

// Rate limiting, as for the booking-card count: per IP in this instance's
// memory only (never written anywhere), and an overall hourly ceiling in
// RateLimitHit under one fixed key with no visitor data in it.
const IP_WINDOW_MS = 10 * 60 * 1000;
const IP_LIMIT = 10;
const GLOBAL_KEY = "metrics:contact-click";
const GLOBAL_LIMIT_PER_HOUR = 300;
const ipHits = new Map<string, { count: number; resetAt: number }>();

const connectingIp = (req: Request) =>
  String(req.headers["x-forwarded-for"] || req.socket.remoteAddress || "")
    .split(",")[0]
    .trim();

/** True when this click should be saved. Fails open on database errors. */
export const allowContactClick = async (req: Request) => {
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
      "contact-click rate limit check failed (allowing):",
      error instanceof Error ? error.message : error,
    );
  }
  return true;
};

export type StoredClick = {
  at: Date;
  london: string;
  kind: string;
  channel: string;
  landing: string;
  from: string;
};

/**
 * Clicks between `fromAt` and `toAt`, oldest first. Internal only: used by
 * scripts/contact-click-summary.ts, never exposed over HTTP.
 */
export const listContactClicks = async (fromAt: Date, toAt: Date) =>
  (await ContactClick.find(
    { at: { $gte: fromAt, $lte: toAt } },
    { _id: 0, at: 1, london: 1, kind: 1, channel: 1, landing: 1, from: 1 },
  )
    .sort({ at: 1 })
    .lean()) as StoredClick[];

export const MATCH_WINDOW_MINUTES = 180;

/**
 * Email-link clicks in the window before an email arrived (default three
 * hours). A match is claimed only when there is exactly one email-link click
 * and its channel is known (not "unknown" or "lost"); otherwise every
 * candidate is listed and none chosen.
 * The click is saved at minute resolution, so the minute of arrival counts.
 */
export const matchEmailToClick = (
  clicks: StoredClick[],
  emailAt: Date,
  windowMinutes = MATCH_WINDOW_MINUTES,
) => {
  const end = toMinute(emailAt).getTime();
  const start = end - windowMinutes * 60000;
  const candidates = clicks.filter(
    (c) =>
      c.kind === "email" && c.at.getTime() >= start && c.at.getTime() <= end,
  );
  const match =
    candidates.length === 1 &&
    !["unknown", "lost"].includes(candidates[0].channel)
      ? candidates[0]
      : null;
  return { candidates, match };
};
