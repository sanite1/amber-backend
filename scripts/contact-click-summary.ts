// Clicks on the website's email link (mailto:support@) and phone links, read
// straight from the database (no HTTP route exists for them). Uses
// MONGODB_URI from the private local .env.
//
// Usage:
//   npx ts-node --transpile-only scripts/contact-click-summary.ts [days]
//     Every click in the last [days] days (default 7), London time.
//   npx ts-node --transpile-only scripts/contact-click-summary.ts --before <time>
//     The email-link clicks in the three hours before an email arrived, and
//     the match if there is exactly one. <time> is ISO 8601 with its zone,
//     e.g. 2026-11-04T14:15:00Z.
import dotenv from "dotenv";
dotenv.config();
import mongoose from "mongoose";
import {
  MATCH_WINDOW_MINUTES,
  listContactClicks,
  matchEmailToClick,
} from "../src/services/contactClickMetrics.service";

const main = async () => {
  if (!process.env.MONGODB_URI) throw new Error("MONGODB_URI is not set");
  const beforeAt = process.argv.indexOf("--before");
  let output: unknown;
  await mongoose.connect(process.env.MONGODB_URI);
  try {
    if (beforeAt >= 0) {
      const emailAt = new Date(process.argv[beforeAt + 1] ?? "");
      if (Number.isNaN(emailAt.getTime())) {
        throw new Error("--before needs a time such as 2026-11-04T14:15:00Z");
      }
      const from = new Date(emailAt.getTime() - MATCH_WINDOW_MINUTES * 60000);
      const clicks = await listContactClicks(from, emailAt);
      const { candidates, match } = matchEmailToClick(clicks, emailAt);
      output = {
        emailAt: emailAt.toISOString(),
        windowMinutes: MATCH_WINDOW_MINUTES,
        match: match ?? null,
        candidates,
        verdict: match
          ? `One email-link click: came from ${match.channel} (matched by time, not certain)`
          : candidates.length
            ? `${candidates.length} candidate click(s), none chosen`
            : "No email-link click in the window",
      };
    } else {
      const days = Math.min(
        Math.max(Number(process.argv[2] ?? 7) || 7, 1),
        400,
      );
      const to = new Date();
      const clicks = await listContactClicks(
        new Date(to.getTime() - days * 86400000),
        to,
      );
      const byChannel: Record<string, number> = {};
      for (const c of clicks)
        byChannel[c.channel] = (byChannel[c.channel] ?? 0) + 1;
      output = {
        days,
        total: clicks.length,
        byChannel,
        clicks: clicks.map(({ london, kind, channel, landing, from }) => ({
          london,
          kind,
          channel,
          landing,
          from,
        })),
      };
    }
  } finally {
    await mongoose.disconnect();
  }
  console.log(JSON.stringify(output, null, 2));
};

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
