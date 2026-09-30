import { Request } from "express";
import RateLimitHit from "../models/RateLimitHit";

// Spam protection for the public booking and contact forms.
//
// Principle: never lose a real enquiry. Only two signals drop a submission
// outright (the hidden honeypot field was filled in, or the form was
// submitted faster than a person could fill it). Everything else that looks
// like spam is still delivered to the inbox, marked "[Possible spam]", and the
// sender gets no automatic confirmation email, so bots cannot use Amber's
// mailbox to send mail to third parties.

// A person cannot complete either form in under three seconds.
const MIN_FILL_MS = 3000;

const RATE_WINDOW_LABEL = "hour";
// Submissions allowed per rolling hour.
const LIMIT_PER_CLIENT_IP = 5;
const LIMIT_PER_EMAIL = 5;
// The no-JavaScript booking path reaches us from the website's own server, so
// many visitors share that connecting IP. It gets a higher ceiling, and the
// visitor's own IP (forwarded by the website) is limited separately.
const LIMIT_PER_SERVER_IP = 40;

export const clip = (v: unknown, max: number): string | undefined => {
  if (typeof v !== "string" && typeof v !== "number") return undefined;
  const s = String(v).trim();
  return s ? s.slice(0, max) : undefined;
};

// Letters, digits and common punctuation before the @, a dotted domain after.
// Rejects quotes, angle brackets and spaces, which have no place in a real
// address and could otherwise be used to inject HTML into the inbox email.
export const isValidEmail = (email: string) =>
  email.length <= 254 &&
  /^[A-Za-z0-9._%+'-]+@[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}$/.test(
    email,
  );

// Vercel overwrites x-forwarded-for with the real client IP, so it cannot be
// spoofed by the caller.
const connectingIp = (req: Request) =>
  String(req.headers["x-forwarded-for"] || req.socket.remoteAddress || "")
    .split(",")[0]
    .trim();

export type Verdict =
  | { action: "drop"; reason: string }
  | { action: "accept"; flags: string[] };

const LINK = /(https?:\/\/|www\.)/i;
const SALES_PITCH =
  /\b(seo|smo|ppc|backlinks?|guest posts?|link building|web ?design|website (design|development|redesign)|digital marketing|marketing (services|agency)|social media (marketing|management)|lead generation|rank(ing)? (on|in|higher)|first page of google|app development|outsourc\w*|virtual assistant)\b/i;

/**
 * Decide what to do with a form submission.
 * @param names  free-text name fields (company, contact, first/last name)
 * @param texts  free-text message fields
 */
export const assessSubmission = (opts: {
  honeypot: unknown;
  fillMs: unknown;
  names: (string | undefined)[];
  texts: (string | undefined)[];
  phone?: string;
}): Verdict => {
  if (typeof opts.honeypot === "string" && opts.honeypot.trim() !== "") {
    return { action: "drop", reason: "honeypot" };
  }
  const fill = Number(opts.fillMs);
  if (Number.isFinite(fill) && fill >= 0 && fill < MIN_FILL_MS) {
    return { action: "drop", reason: `submitted in ${Math.round(fill)} ms` };
  }

  const flags: string[] = [];
  if (opts.names.some((n) => n && LINK.test(n))) flags.push("link in a name");
  if (opts.texts.some((t) => t && LINK.test(t)))
    flags.push("link in the message");
  if ([...opts.names, ...opts.texts].some((t) => t && SALES_PITCH.test(t)))
    flags.push("reads like a sales pitch");
  if (opts.phone) {
    const digits = opts.phone.replace(/\D/g, "").length;
    if (digits < 10 || digits > 13) flags.push("unusual phone number");
  }
  return { action: "accept", flags };
};

/**
 * Count this submission against its limits. Returns a message when a limit is
 * exceeded. Fails open: if the database is unavailable the enquiry proceeds.
 */
export const checkRateLimit = async (
  req: Request,
  kind: "booking" | "contact",
  email: string,
): Promise<string | null> => {
  const ip = connectingIp(req);
  const forwarded = clip(req.headers["x-amber-client-ip"], 64);
  const checks: [string, number][] = [
    [`email:${email.toLowerCase()}`, LIMIT_PER_EMAIL],
  ];
  if (forwarded) {
    checks.push([`${kind}:server:${ip}`, LIMIT_PER_SERVER_IP]);
    checks.push([`${kind}:ip:${forwarded}`, LIMIT_PER_CLIENT_IP]);
  } else if (ip) {
    checks.push([`${kind}:ip:${ip}`, LIMIT_PER_CLIENT_IP]);
  }

  try {
    for (const [key, limit] of checks) {
      const count = await RateLimitHit.countDocuments({ key });
      if (count >= limit) {
        return `Too many requests in the last ${RATE_WINDOW_LABEL}. Please email support@ambertraining.co.uk or call +44 7763 658885 and we will help straight away.`;
      }
    }
    await RateLimitHit.insertMany(checks.map(([key]) => ({ key })));
  } catch (error) {
    console.error(
      "rate limit check failed (allowing request):",
      error instanceof Error ? error.message : error,
    );
  }
  return null;
};
