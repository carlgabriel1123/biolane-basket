# Biolane Nesting Checklist — Grand Baby Fair

Mobile-first microsite for the Biolane Philippines Grand Baby Fair activation.
A mom scans a QR at the booth and:

1. **Tells us about herself and her little one** — first name and surname, whether she is
   Dad, Mom, Grandparent or Others (with a box to specify), email, mobile,
   TikTok / Instagram (tick one or both and type the username, or tick N/A),
   baby stage, due date if expecting, optional marketing consent. Her lead
   is saved the moment she taps Join.
2. **Builds her checklist** — the ₱2,299 reward is introduced here, and the
   products picked for her baby stage come first, everything else is folded under "See all". Each product has
   **Add**, then **− qty +**. Her total climbs toward ₱2,299 and unlocks a
   free personalized toiletry bag.
3. **Shows the confirmation** to the Biolane team at the booth.

Next.js 15 · TypeScript · Tailwind v4 · no external UI libraries.

```bash
npm install
npm run dev      # http://localhost:3100
npm test         # validation, basket maths, and price/stage invariants
npm run build
```

---

## Design ("Nursery Soft")

The look is defined once and reused everywhere: brand tokens and motion in
`app/globals.css`, the icon family in `components/icons.tsx`, and the
building blocks (Button, ChoiceChip, Card, Badge, StepIndicator,
BottleMeter, stage tones) in `components/ui.tsx`. The brief every screen
follows is `docs/superpowers/specs/2026-09-23-nursery-soft-redesign.md`.
Each baby stage has its own tint and icon (Expecting peach/heart, Baby
sky/baby, Toddler mint/sun, Others lilac/sparkles); the reward meter is a
bottle that fills as the basket grows. No emoji are used as icons.

## What you will want to edit

Everything tweakable lives in three data files. No component needs touching.

| Want to change | File | Field |
|---|---|---|
| Which products each baby stage sees first, and their order | `data/stages.ts` | `picks` |
| "You might also like" and "Almost there" per stage | `data/stages.ts` | `suggestions` |
| "You might also like" heading | `data/campaign.ts` | `recsTitle` |
| Line under the Checklist heading, per stage | `data/stages.ts` | `caption` |
| "Checklist" heading | `data/campaign.ts` | `checklistSectionTitle` |
| Baby stage options on the form | `data/campaign.ts` | `babyStages` |
| "Are you…" options on the form | `data/campaign.ts` | `relationships` |
| Reward threshold | `data/campaign.ts` | `rewardThreshold` |
| Most units of one product per mom | `data/campaign.ts` | `maxQtyPerItem` |
| Reward name | `data/campaign.ts` | `rewardName`, `rewardShortName` |
| Sign-up button text | `data/campaign.ts` | `joinCtaLabel` |
| Sign-up page heading | `data/campaign.ts` | `communityHeading`, `communitySubheading` |
| Privacy / Terms links | `data/campaign.ts` | `privacyPolicyUrl`, `termsUrl` |
| Consent wording | `data/campaign.ts` | `consentLabel` |
| Names, sizes, groups | `data/products.ts` | `name`, `size`, `group` |
| Which biolane.ph listing a product is | `data/shopify-map.ts` | `handle`, `variant` |
| Product blurbs / BA talking points | `data/products.ts` | `blurb`, `whyThis` |
| Product images | biolane.ph (the listing's photo) | fallback art in `public/images/products/` |

**After any price, threshold, or picks edit, run `npm run verify`.** It fails
if a pick is misspelled or repeated, if a stage's picks can no longer reach
the reward, if a suggestion repeats a Checklist item, or if a sun or mosquito
product is listed for Expecting or Baby.

### What each stage sees

The lists come from the Biolane team (September 2026). **Checklist** shows
first, in this order. **You might also like** appears under it as soon as
the visitor adds their first product (a small "See them" nudge points to it
if it's off-screen). Everything else stays under "See all".

Prices, sale prices, stock and photos come from biolane.ph (see below).
Items marked † are not sold on biolane.ph: they show in place with "Ask our
team" and can't be added. A product biolane.ph has sold out stays on the
Checklist marked **Sold out** (the list she sees is always complete) but is
never suggested, never in "See all", and can't be added.

| Stage | Checklist (in order) | You might also like |
|---|---|---|
| Expecting | Pure H2O 750ml, 2-in-1 Cleanser 750ml / 350ml / 200ml, Diaper Change Cream 100ml, Diaper Change Cream 50ml †, Nourishing Cream 100ml, Liquid Powder, Stretch Marks Cream, Soothing Intimate Hygiene Gel | Soothing Repairing Balm, Pure H2O Wipes †, Cleansing Milk Wipes, Sweet Almond Oil Spray, Extra Rich Soap, Gentle Cleansing Milk 750ml |
| Baby 0 to 12 months | Pure H2O 750ml, Gentle Cleansing Milk 750ml, 2-in-1 Cleanser 750ml / 350ml / 200ml, Diaper Change Cream 100ml, Liquid Powder, Nourishing Cream 100ml, Body Milk 350ml, Gentle Shampoo 350ml | Cradle Cap Shampoo, CicaBébé, Sweet Almond Oil Spray, Extra Rich Soap, First Teeth Toothpaste †, Pure H2O Wipes †, Cleansing Milk Wipes, Baby Powder † |
| Toddler 1 to 4 years old | Gentle Shampoo 350ml, 2-in-1 Cleanser 750ml / 350ml, Body Milk 350ml, Diaper Change Cream 100ml, Liquid Powder, Skin Freshening Fragrance, Styling Gel, Organic Arnica Gel, CicaBébé | Pure H2O 750ml, Gentle Cleansing Milk 750ml, Baby Sunstick SPF 50+, Pure H2O Wipes †, Cleansing Milk Wipes, Nourishing Cream 100ml |
| Others | Every in-stock product, by category | — (Almost there may offer anything in stock) |

**† Not on biolane.ph** (September 2026): Diaper Change Cream 50ml (only
inside bundle sets), Pure H2O Wipes x72, First Teeth Toothpaste, Baby Powder
and Kids Detangling Shampoo. Each has a `note` in `data/products.ts`. When the
store lists one, add its handle to `data/shopify-map.ts` and run
`npm run sync-shopify`: it gets a price, a photo and an Add button by itself.
`npm run verify` lists which items on each stage's lists are not addable.

**"Almost there"** (the box beside the progress bar) only ever offers
products from that stage's **You might also like** list, in stock and not yet
in the basket: one product that completes the gift if any (the cheapest
such), else the fewest products (up to 3) that complete it, else the set that
gets closest ("gets you closer"). It never offers a Checklist item. Others has
no list, so it may offer anything in stock. The rules are tested in
`scripts/test-basket.mjs`.

Sun and mosquito products are never listed for Expecting or Baby:
biolane.ph says the mosquito stick is "from 6 months" and to keep babies
under 6 months in the shade, and "Baby" covers 0 to 12 months. They stay
available under "See all".

---

## Where the prices come from (biolane.ph)

Every price, crossed-out price, stock status, product photo and "View on
biolane.ph" link is read from the Biolane Philippines Shopify store:

    https://biolane.ph/products.json?limit=250

`data/shopify-map.ts` says which listing (and which size variant) each
product is. `lib/shopify.ts` fetches the store when the page is built and
again at most every 30 minutes (`export const revalidate = 1800` in
`app/page.tsx`), so a price or stock change on biolane.ph reaches the site
within half an hour with no deploy. If biolane.ph can't be reached, or
answers with fewer than 80% of the expected products, the saved copy in
`data/shopify-snapshot.ts` is used instead, so the checklist never goes
blank. Refresh that copy with `npm run sync-shopify` (it prints an audit of
every product: matched, price changes, sold out, not found). The tests and
`npm run verify` run against the saved copy.

Some biolane.ph prices have centavos (₱772.80, ₱1,850.20): the basket adds
them up in centavos and shows them only when present (`lib/format.ts`).
The sale price is what biolane.ph charges; the crossed-out price is its
"compare at" price when higher.

Display names are the team's (`data/products.ts`), which sometimes differ
from the store's titles: Liquid Powder is sold as "Liquid Talc", the
Soothing Intimate Hygiene Gel as "Feminine Wash", the Topilane AD range was
"Atopiane" here before. The Pure H2O 350ml is left off the site on the
team's request (September 2026); the refill shares its listing on the store
("Biolane Pure H2O Cleanser 350 ml").

`gbfSku` in `data/products.ts` is the team's booth SKU from their price
sheet, kept for verification at the booth; it is blank for products that
sheet never listed.

**Fallback artwork** (`public/images/products/`, `imageIsPlaceholder: true`)
is only used when the store has no photo for a product.

---

## The maths behind the reward

`npm run verify` checks the saved biolane.ph copy against the stage lists
(exact subset-sum over in-stock products, in centavos):

- The gift unlocks at **₱2,299 or more**. Prices are biolane.ph's, so exact
  totals shift as the store changes them; the script prints the cheapest
  qualifying basket and the minimum number of products.
- Every stage's Checklist alone (one of each in-stock item) can reach the
  threshold.
- "Almost there" only uses the stage's Suggestions list, so it can hit a
  point where nothing left completes the gift: it then shows the products
  that get closest, worded as "gets you closer", never as "completes".

---

## Deployment

**Vercel** hosts the real site (it has a small server route that saves sign-ups):
**https://biolane.vercel.app** — use this address for the QR code. Every
push to `main` deploys it automatically (the GitHub repo is connected to the
Vercel project `biolane-basket`). `biolane-basket.vercel.app` serves the same
site. The `…-cgp8.vercel.app` addresses are Vercel's internal ones and ask
for a Vercel login, so never share those.

Vercel → Project → Settings → Environment Variables must have:

| Name | What |
|---|---|
| `SUPABASE_URL` | `https://qomynrtdrzpzaevotird.supabase.co` |
| `SUPABASE_PUBLISHABLE_KEY` | the project's publishable key (Supabase → Settings → API Keys) |
| `SUBMIT_TOKEN` | the write token; only its SHA-256 is stored in the database |

The same three go in `.env.local` (git-ignored) for local runs.

**GitHub Pages** (`https://carlgabriel1123.github.io/biolane-basket/`) is run by
`.github/workflows/deploy.yml`, which always runs the tests first. Its
`PAGES_MODE` setting decides what Pages serves:

- `redirect` (current) — sends every visitor to https://biolane.vercel.app,
  so an old QR code or link still lands on the working site.
- `static` — a copy of the site **without saving** (sign-ups stay on the
  phone). Only for emergencies if Vercel is down.

## Admin dashboard — https://biolane.vercel.app/admin

For the Biolane team at the booth. Not linked from the public site and
hidden from search engines.

- **First visit ever:** a one-time page asks for the **setup code** (the
  `SETUP_SECRET` env var, or `ADMIN_TOKEN` when that isn't set — only the
  site owner has it) and lets you create the admin username and password
  (10+ characters). Keep it safe: it's the only login. Nobody without the
  setup code can create the account, and the database allows exactly one.
- **Log in** lasts 12 hours per device. Five wrong tries in 15 minutes lock
  that device (its IP + the username) for 15 minutes; thirty wrong tries
  against the username from anywhere lock it for 15 minutes. Both are
  counted in the database, so they hold everywhere and can't be raced.
- **What you see:** every sign-up, newest first, with date and time (Manila),
  claim code, name, Dad/Mom/Grandparent/Others, mobile (tap to call), email,
  TikTok / Instagram (tap to open the profile, or "No TikTok / Instagram"),
  baby stage, due date, consent, Signed up / Finished, basket total, gift
  unlocked, bag name, and the products. Search by claim code, name, mobile,
  email or username; filter by Unpaid, Paid, Gift unlocked, Finished, Signed up only or
  stage. Counts on top (always for all dates). Refreshes itself every 30 s.
- **Date filter:** the date box next to the search lists every day that has
  sign-ups, with how many (e.g. "Thu, Jul 2 (12)"); pick one to see only that
  day. **Custom range…** opens From / To boxes for several days (Jul 2 to
  Jul 3). Days are Manila dates of when she signed up. **Download CSV** then
  downloads only those dates (`/api/admin/export?from=YYYY-MM-DD&to=YYYY-MM-DD`).
- **Mark paid:** one tap when the purchase is verified; it records the time.
  Tap again (with a confirmation) to undo.
- **Download CSV:** everything, ready for Excel or Google Sheets.
- **Change password** and **Log out** are in the top right. Changing the
  password logs every other device out.

### Google Sheets (live copy of the sign-ups)

Once, about three minutes:

1. Create a Google Sheet. Open **Extensions → Apps Script**.
2. Delete what's there, paste **`docs/google-sheets/Code.gs`**, and set
   `SECRET` to the value of `SHEETS_WEBHOOK_SECRET`.
3. **Deploy → New deployment → Web app**, Execute as **Me**, Who has access
   **Anyone** (not "Anyone with Google account"). Approve the permissions
   (Advanced → Go to … if Google warns it's unverified — it's your own
   script). Copy the Web app URL (ends in `/exec`).
4. Open that URL in a browser. It should show `"ok":true`, the current
   `"version"` (the `VERSION` line in `Code.gs`) and `"secretSet":true`. A
   Google sign-in page means step 3's access setting is wrong.
5. Put the URL in Vercel as `SHEETS_WEBHOOK_URL` and redeploy. Then press
   **Sync sheet** on the dashboard: it sends any sign-up the sheet is missing
   and, with nothing to send, checks that the sheet accepts the secret ("The
   sheet is connected and up to date").
6. Reload the sheet in a computer browser: a **Biolane** menu appears next to
   Help (not in the Sheets phone app). Google asks you to authorize it the
   first time you use it.

From then on every sign-up, finished checklist and Paid change appears in a
**Sign-ups** tab within seconds, one row per claim code (a finished checklist
updates its sign-up's row; a stale retry never overwrites a fresher row). If
Google is briefly unreachable, the row still saves here and is re-sent by the
dashboard's **Sync sheet** button, whenever staff have the dashboard open,
and by the daily health cron. Never reorder the sheet's columns; the script
writes them by position.

**After changing `Code.gs`** (for example when the TikTok / Instagram columns
were added): first copy your line `var SECRET = '…';`, then paste the new
file over everything, put that line back, and click Save. Then **Deploy →
Manage deployments → pencil → Version: New version → Deploy** (the URL stays
the same; "New deployment" would make a new URL the site doesn't use). Open
the URL and check the `"version"` changed and `"secretSet":true`. The
script upgrades an older sheet in place on its next save: it inserts the new
columns after Mobile and every existing row keeps its values. Then press
**Sync sheet** once.

**Start fresh (keep a backup tab)** — e.g. to clear test sign-ups before the
fair. Only once the step above shows the new version:
1. In the sheet: **Biolane → Start fresh (keep a backup tab)… → Yes.** The
   whole Sign-ups tab is copied, exactly as it is, into a grey, protected tab
   named `Backup <date> <time>`, then its rows are removed from Sign-ups (the
   header stays). New sign-ups keep arriving in Sign-ups.
2. On the admin page press **Sync sheet**, and answer OK to "Send all … sign-ups
   to it again?". Everyone still in the admin is put back into Sign-ups
   (nothing is duplicated). With an empty admin there is nothing to send.

Start fresh never changes the columns; only the deployed script does, so the
header always matches the version writing the rows. To also clear the admin,
the database rows are archived (see "Where sign-ups are saved"). Visitor-typed text is stored as plain text, so
nothing typed on the site can run as a formula in the sheet or the CSV.

**Keep the copies private.** The sheet and any downloaded CSV hold names,
mobiles, emails and due dates. Use a company Google account rather than a
personal one, share the sheet view-only with as few people as possible
(anyone who can edit the script can read the secret), delete downloaded
CSVs from booth phones after the fair, and when the fair data is no longer
needed delete the Backup tabs (and the whole sheet only if the site is being
retired: deleting it also deletes the script, and saves stop reaching any
sheet). If the script was shared with editors, rotate
`SHEETS_WEBHOOK_SECRET` (new value in Vercel and in `Code.gs`, redeploy both).

### Admin environment variables (Vercel + `.env.local`)

| Name | What |
|---|---|
| `ADMIN_TOKEN` | server ↔ database token for the `admin_*` functions (hash stored in `private.write_tokens`, scope `admin`) |
| `SESSION_SECRET` | signs the login cookie; changing it logs everyone out |
| `SETUP_SECRET` | optional: the setup code typed on the one-time setup page (defaults to `ADMIN_TOKEN`) |
| `SHEETS_WEBHOOK_URL` | the Apps Script web app URL (`…/exec`) |
| `SHEETS_WEBHOOK_SECRET` | must equal `SECRET` inside `Code.gs` |
| `CRON_SECRET` | Vercel sends it with the daily cron so `/api/health` may retry sheet syncs |

To reset the admin login entirely (forgotten password): in the SQL Editor
run `delete from private.admin_users;` — the next visit to `/admin` shows
the setup page again, and it needs the setup code, so only the owner can
create the new account. Do it right away; nobody else can, but the
dashboard is unusable until it's done.

## Where sign-ups are saved

Supabase project **biolane-nesting-checklist** (Singapore), table
`public.submissions`: one row per claim code, created on Join and updated
when the checklist is finished.

**Archive.** On 2026-09-24 the 9 sign-ups made before the fair (tests and early
sign-ups) were moved, not deleted, into `private.submissions_archive` (same
columns plus `archived_at`) so the admin could start fresh. It is only
reachable from the SQL Editor; the dashboard, CSV and sheet never read it.
To bring them back:

```sql
begin;
insert into public.submissions (submission_id, seq, event, submitted_at, received_at, updated_at,
  name, relationship, relationship_other, email, mobile, baby_stage, due_date, marketing_consent,
  selected_products, basket_total, reward_unlocked, personalization_name, write_key_hash, paid_at,
  sheet_synced_at, tiktok, instagram, no_socials, first_name, last_name)
select submission_id, seq, event, submitted_at, received_at, updated_at,
  name, relationship, relationship_other, email, mobile, baby_stage, due_date, marketing_consent,
  selected_products, basket_total, reward_unlocked, personalization_name, write_key_hash, paid_at,
  null, tiktok, instagram, no_socials, first_name, last_name
from private.submissions_archive a
where not exists (select 1 from public.submissions s where s.submission_id = a.submission_id);
delete from private.submissions_archive a
where exists (select 1 from public.submissions s where s.submission_id = a.submission_id);
commit;
```

(`sheet_synced_at` is left empty so the rows are sent to the sheet again.)
Columns added to `submissions` later sit after `archived_at` in the archive,
so always archive or restore with explicit column lists, never `select *`.

**To see or export them:** Supabase → Table Editor → `submissions`, or SQL
Editor → `select * from submissions_readable order by submitted_manila desc;`
then **Export → CSV**. The readable view shows claim code, status, Manila
time, name, relationship, email, mobile, stage, due date, consent, total,
reward, bag name, a one-line product list, TikTok / Instagram ("N/A" when
she ticked N/A), and first name / surname (empty for sign-ups from before
the form asked for them separately).

**How a save travels:** phone → `POST /api/submit` (this site's own server,
`app/api/submit/route.ts`) → validated field by field → database function
`upsert_submission`. The public can't read or write the table at all.

- The function only runs with the server's `SUBMIT_TOKEN`, which never
  reaches the browser.
- Every record carries a hidden per-record write key made on the phone, so
  knowing a claim code is not enough to overwrite someone's record.
- A finished checklist always beats a later-arriving sign-up for the same
  claim code.
- The phone keeps a copy of anything not yet saved and re-sends it on the
  next load, when the connection returns, and every 30 seconds. Once saved,
  the phone's copy is deleted. If the network drops, the confirmation shows
  an amber **"Will sync"** badge instead of **"Saved"** — still a valid claim.

**Keep-alive:** free Supabase projects pause after about a week with no
traffic. `vercel.json` runs a daily cron on `/api/health`, which pings the
database. Open `/api/health` on a phone any time — `{"ok":true}` means saving
works.

**Rotating the write token** (if it ever leaks):
1. Make a new random token, e.g. `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`.
2. In the SQL Editor: `insert into private.write_tokens (name, token_hash) values ('2026-10', encode(extensions.digest('<new token>', 'sha256'), 'hex'));`
3. Put the new token in Vercel's `SUBMIT_TOKEN` and redeploy.
4. Delete the old row from `private.write_tokens`.

**Retention:** the due date is health information and the table holds
contact details. Export what the team needs after the fair follow-up, then
clear it, the archive too:
`delete from public.submissions where submitted_at < now() - interval '90 days';`
`delete from private.submissions_archive where submitted_at < now() - interval '90 days';`
and delete the sheet's Backup tabs at the same time.

The stored record contains: claim code, timestamp, first name and surname
(plus the full name, "First name Surname", which the dashboard, CSV and sheet
show; older sign-ups have only the full name), relationship (and
the "Others" text), email, mobile (normalised to `+639XXXXXXXXX`), TikTok and
Instagram usernames (bare and lower-case, no @) or the N/A flag, baby stage,
due date (only when Expecting), marketing consent, selected products with
SKUs and prices, basket total, reward-unlocked flag, bag name.

## Analytics

`lib/analytics.ts` exposes no-op hooks for `nesting_started`,
`product_selected`, `product_removed`, `reward_progress`, `reward_unlocked`,
`community_signup_started`, `community_signup_completed`, `form_submitted`.
Uncomment the Meta Pixel / GA4 lines to connect. The site runs fine without them.

---

## Booth behaviour worth knowing

- **Start over** is on the checklist and the confirmation, and wipes
  everything in one tap.
- A refresh keeps her place, details and basket — but only in that browser
  tab (`sessionStorage`). Start over clears it, so the next guest never sees
  the last one's details.
- **Change** next to her stage opens the four stage options right on the
  checklist. Tapping one swaps her picks instantly and keeps her basket; her
  lead record is re-sent with the new stage. The phone's Back button still
  returns to the sign-up with every field filled in.
- One record per mom: it is saved on sign-up and updated on finish with the
  same **claim code** (`BIO-XXXXXXXX`). Changing the basket afterwards
  cannot change what staff see.
- If the network drops, the confirmation still appears with an amber
  **"Will sync"** badge. It is still a valid claim — hand over the bag.
- If a booth tablet's clock is wrong, saves still work: the server corrects
  for a clock that runs fast.
- Consent is never pre-checked and never blocks submission.

## Assets

Product photos are biolane.ph's own (Shopify's CDN, allowed in
`next.config.mjs` → `images.remotePatterns`) and are resized by Vercel. The
logo and the fallback packshots are served locally from `public/images/`.
