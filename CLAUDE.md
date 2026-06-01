# CLAUDE.md — amber-backend (API)

Backend API for **ambertraining.co.uk** (a B2B on-site first aid training
provider, London). Express + TypeScript + MongoDB (Mongoose), nodemailer for
email, Stripe present but unused for the current B2B flow. Deployed on Vercel as
a single serverless function (`src/index.ts`, see `vercel.json`). Production URL:
`https://amber-backend-seven.vercel.app`. The frontend is a separate repo
(`amber-mvp`) and calls this API at `/api`.

## Goal
Receive B2B booking/quote enquiries from the frontend `/book` form and email
them to `support@ambertraining.co.uk` (no payment taken). Pricing is set on the
frontend: EFAW £550/session, FAW £1,500/session, up to 12 delegates, on-site.

## What is built and live
- **`POST /api/contact/booking`** — the B2B booking/quote endpoint
  (`src/controllers/contact.controller.ts` → `src/routes/contact.routes.ts`).
  Validates company/contact/email/courseType. Captures company, contact, email,
  phone, course type, delegates, preferred dates, venue address, special
  requirements. Sends:
  1. a **branded notification email** to the inbox (replyTo = client), and
  2. a **branded confirmation email** to the client (best-effort).
- **`POST /api/contact/enquiry`** — general enquiry email to the inbox.
- Email building lives in `src/services/nodemailer/mail.service.ts`:
  `sendBookingEnquiryMail`, `sendEnquiryMail`, plus a shared branded
  HTML email shell (`emailShell`, `courseCard`, `detailRow`, `btn`).
- The pre-existing routes (users, courses, payment, admin, etc.) are legacy from
  the original tutoring-marketplace template and are not part of the B2B flow.

## Email design (brand)
- HTML email shell: hosted Amber logo header
  (`https://res.cloudinary.com/dv4uk8qqc/image/upload/v1745396912/Amber_Users/vs3ygjavp7jwjp7gdqws.png`),
  `#FF7C22` accent bar, Raleway headings / Lora body with Arial/Georgia
  fallbacks, `#555964` dark footer with phone/email. Internal email includes a
  course/price card (EFAW £550 / FAW £1,500), a clean details table, a cream
  action box, and a one-click **Reply-to-client** button (pre-populated mailto).
- All user input is HTML-escaped (`esc`).

## Env (in `.env`, never committed)
- `MONGODB_URI`, `JWT_SECRET`, Cloudinary vars, `STRIPE_SECRET_KEY`.
- `AUTH_EMAIL=support@ambertraining.co.uk`, `AUTH_PASS` — the SMTP mailbox
  (Namecheap Private Email, `mail.privateemail.com:465`) used to send and the
  inbox that receives booking notifications.
- `DOMAIN_NAME=https://www.ambertraining.co.uk`.
- No Anthropic/OpenAI key (so no server-side AI generation here).

## Key technical decisions (why)
- **Inline HTML emails, not handlebars templates:** self-contained, brand-styled,
  no template-file dependency. Old `.handlebars` templates remain for legacy
  routes only.
- **Hosted Cloudinary logo** in emails: email clients need an absolute image URL;
  the logo was already hosted there by the original template.
- **CORS is open (`origin: "*"`)** so the frontend (different origin) can POST.

## Deploy / Git
- **Production branch = `develop`** → auto-deploys. This Vercel project does NOT
  enforce the Git-author check (unlike amber-mvp), so author email is not a
  blocker here, but the agreed workflow is still branch → PR → `sanite1` merges.
- git user.email is set to `earljoey0@gmail.com` in this repo.
- Husky pre-commit runs prettier + `tsc`.

## Current PR status (1 Jun 2026)
- **PR #44** — MERGED + live: the booking/enquiry endpoints + premium branded
  emails. Verified: `POST /api/contact/booking` returns 200 in production and
  emails arrive in the inbox.

## Still needed post-deploy
- Nothing required on the backend. The booking endpoint and emails are live and
  tested. (Frontend has a `POST_DEPLOY_CHECKLIST.md` for GSC/GA4/Lighthouse.)

## Context for a future session
- If the booking email design or fields change, edit
  `src/services/nodemailer/mail.service.ts` only; the frontend posts the field
  names listed under `BookingEnquiryPayload`.
- Course names/prices shown in emails are derived in `courseInfo()` from the
  `courseType` string ("EFAW" | "FAW") sent by the frontend — keep in sync with
  amber-mvp `lib/data/courses.ts`.
