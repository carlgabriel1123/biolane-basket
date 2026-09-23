# Admin dashboard, Paid button and Google Sheets sync — design

Date: 2026-09-23. Approved by the site owner in chat the same day.

## Goal

Booth staff open **https://biolane.vercel.app/admin** on a phone or laptop,
log in once, see every sign-up as it arrives, mark a sign-up **Paid** when
the purchase is verified, and have the same data land in a Google Sheet
within seconds.

## What is built

### 1. Login (one shared admin account)

- The first visit to `/admin` shows a **one-time setup page** where the owner
  creates the admin username and password. Once a user exists the page is
  gone for good.
- Passwords are stored as scrypt hashes in `private.admin_users` (never in
  Vercel env vars, never in the browser). Login compares in constant time.
- A successful login sets a signed, `HttpOnly`, `Secure`, `SameSite=Lax`
  cookie valid for 12 hours. The signature covers the username, expiry and
  the time the password was last changed, so changing the password logs out
  every device.
- Wrong passwords are throttled per IP and per username in the database
  (5 failures → 15-minute lock), so the limit holds across Vercel instances.
- The dashboard has a small **Change password** form and a **Log out** button.
- `/admin` sends `robots: noindex` and is never linked from the public site.

### 2. Dashboard (`/admin`)

- Newest first. Cards on phones, a table on wide screens, in the site's look.
- Per sign-up: date and time (Asia/Manila), claim code, name, Dad/Mom/
  Grandparent/Others (+ the "specify" text), mobile, email, baby stage, due
  date, marketing consent, status (**Signed up** or **Finished**), basket
  total, gift unlocked, bag name, and the product lines on tap.
- **Paid** button: one tap sets `paid_at = now()`. Tapping again asks to
  confirm, then clears it. The change is optimistic in the UI and reverted
  if the server refuses.
- Search box matches claim code, name, mobile or email. Filters: Unpaid,
  Paid, Gift unlocked, and each stage. Counts on top: today, total, finished,
  gift unlocked, paid.
- Refreshes every 30 s by asking only for rows changed since the last fetch.
- **Download CSV** (all rows, all fields) and **Sync sheet** (re-send rows
  the sheet has not confirmed).

### 3. Google Sheets sync

- The owner creates a Google Sheet and pastes the provided Apps Script
  (`docs/google-sheets/Code.gs`), deploys it as a web app ("Execute as: Me",
  "Who has access: Anyone") and gives the site its URL and the shared secret.
- Vercel env: `SHEETS_WEBHOOK_URL`, `SHEETS_WEBHOOK_SECRET`.
- The server posts one flat row per claim code to the script after every
  successful save (sign-up or finished checklist) and after every Paid
  change. The script upserts by claim code into a `Sign-ups` tab (creating
  the header row on first use), so a finished checklist updates its
  sign-up's row instead of adding a second one. Paid and Paid at columns
  are updated too.
- A sheet failure never fails the save. The row is marked unsynced and is
  retried by the dashboard's **Sync sheet** button and by the daily
  `/api/health` cron (up to 50 rows a run).

## Data changes (Supabase migration `admin_dashboard`)

- `public.submissions` + `paid_at timestamptz`, `sheet_synced_at timestamptz`.
- `private.admin_users(username, password_hash, password_changed_at, created_at)`.
- `private.login_throttle(key, fails, locked_until, updated_at)`.
- `private.write_tokens` + `scope` (`submit` | `admin`); a new admin token.
- SECURITY DEFINER RPCs gated by the admin token, `search_path = ''`, anon
  may execute: `admin_get_user`, `admin_create_user`, `admin_set_password`,
  `admin_throttle`, `admin_list_submissions(since)`, `admin_set_paid`,
  `admin_mark_synced`, `admin_unsynced`.
- `upsert_submission` now returns the stored row so the save route can
  forward the exact stored values (including `paid_at`) to the sheet.
- `submissions_readable` gains `paid_at`.

## Server code

- `lib/admin-auth.ts` — scrypt hash/verify, cookie sign/verify, `requireAdmin`.
- `lib/sheets.ts` — flatten a row for the sheet, `pushToSheet`, `retryUnsynced`.
- `lib/admin-db.ts` — typed wrappers around the admin RPCs.
- Routes under `app/api/admin/`: `setup`, `login`, `logout`, `password`,
  `submissions` (GET, `?since=`), `paid` (POST), `export` (GET CSV),
  `sync` (POST). All POSTs require the session cookie, a same-origin
  `Origin` header and `X-Requested-With: biolane-admin`.
- `app/admin/page.tsx` (server) picks setup / login / dashboard;
  `components/admin/*` are client components.

## Environment variables (Vercel + `.env.local`)

`ADMIN_TOKEN` (server ↔ database), `SESSION_SECRET` (cookie signing),
`SHEETS_WEBHOOK_URL`, `SHEETS_WEBHOOK_SECRET`. Existing ones stay.

## Not in scope

Multiple staff accounts, per-staff attribution, amount-paid entry, "bag
handed over" ticks, editing sign-ups, reading back from the sheet.

## Testing

- `scripts/test-admin.mjs`: hash/verify, cookie sign/verify/expiry/tamper,
  row flattening, CSV escaping.
- Local end to end against Supabase: setup → login → list → Paid → CSV →
  sheet webhook (stubbed locally, real Apps Script once the URL exists).
- Live: adversarial review workflow (auth bypass attempts, CSRF, throttle,
  data exposure) and a real phone-size run through the dashboard.
