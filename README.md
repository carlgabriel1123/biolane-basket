# Biolane Nesting Checklist — Grand Baby Fair

Mobile-first microsite for the Biolane Philippines Grand Baby Fair activation.
A mom scans a QR at the booth and:

1. **Tells us about herself and her little one** — name, whether she is
   Dad, Mom, Grandparent or Others (with a box to specify), email, mobile,
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

## What you will want to edit

Everything tweakable lives in three data files. No component needs touching.

| Want to change | File | Field |
|---|---|---|
| Which products each baby stage sees first, and their order | `data/stages.ts` | `picks` |
| "You might also like" per stage | `data/stages.ts` | `suggestions` |
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
| Promo dates | `data/campaign.ts` | `promoDates` |
| Privacy / Terms links | `data/campaign.ts` | `privacyPolicyUrl`, `termsUrl` |
| Consent wording | `data/campaign.ts` | `consentLabel` |
| Prices, names, sizes | `data/products.ts` | `price`, `name`, `size` |
| Product blurbs / BA talking points | `data/products.ts` | `blurb`, `whyThis` |
| Product images | `public/images/products/` | replace the file, keep the name |

**After any price, threshold, or picks edit, run `npm run verify`.** It fails
if a pick is misspelled or repeated, if a stage's picks can no longer reach
the reward, if a suggestion repeats a Checklist item, or if a sun or mosquito
product is listed for Expecting or Baby.

### What each stage sees

The lists come from the Biolane team (September 2026). **Checklist** shows
first, in this order. **You might also like** appears under it as soon as
the visitor adds their first product (a small "See them" nudge points to it
if it's off-screen). Everything else stays under "See all".

Items marked † are not on the fair price list: they show in place with
"Price at the booth" and can't be added until a price is confirmed.

| Stage | Checklist (in order) | You might also like |
|---|---|---|
| Expecting | Pure H2O 750ml, 2-in-1 Cleanser 750ml / 350ml / 200ml, Diaper Change Cream 100ml, Diaper Change Cream 50ml †, Nourishing Cream 100ml, Liquid Powder, Stretch Marks Cream, Soothing Intimate Hygiene Gel † | Nursing Balm ("Soothing Repair Balm"), Pure H2O Wipes †, Cleansing Milk Wipes †, Sweet Almond Oil Spray, Extra Rich Soap, Gentle Cleansing Milk 750ml |
| Baby 0 to 12 months | Pure H2O 750ml, Gentle Cleansing Milk 750ml, 2-in-1 Cleanser 750ml / 350ml / 200ml, Diaper Change Cream 100ml, Liquid Powder, Nourishing Cream 100ml, Body Milk 350ml, Gentle Shampoo 350ml | Cradle Cap Shampoo, CicaBébé, Sweet Almond Oil Spray, Extra Rich Soap, First Teeth Toothpaste †, Pure H2O Wipes †, Cleansing Milk Wipes †, Baby Powder † |
| Toddler 1 to 4 years old | Gentle Shampoo 350ml, 2-in-1 Cleanser 750ml / 350ml, Body Milk 350ml, Diaper Change Cream 100ml, Liquid Powder, Skin Freshening Fragrance, Styling Gel, Organic Arnica Gel, CicaBébé | Pure H2O 750ml, Gentle Cleansing Milk 750ml, Baby Sunstick SPF 50+, Pure H2O Wipes †, Cleansing Milk Wipes †, Nourishing Cream 100ml |
| Others | All 31 priced products, by category | — |

**† Unpriced products** live in `data/products.ts` → `unpricedProducts`
(LIST OF OFFERS has the 50ml diaper cream and the intimate gel only inside
bundle sets; the wipes, toothpaste and dry baby powder not at all). To put
one on sale: move it into `products` with its `price`, `origPrice`, `gbfSku`
and `sheetRow`, and swap its placeholder art in `public/images/products/`.
`npm run verify` lists which unpriced items each stage shows.

Sun and mosquito products are never listed for Expecting or Baby:
biolane.ph says the mosquito stick is "from 6 months" and to keep babies
under 6 months in the shade, and "Baby" covers 0 to 12 months. They stay
available under "See all".

---

## Where the prices came from

Source: **`SKYHEGLOBAL ACTIVE SKU'S - OCTOBER 8-11.xlsx`**
→ sheet **`LIST OF OFFERS`** → rows **4–34** — the complete E4:E34 range, all 31 SKUs
→ column **H, `MARKDOWN PRICE`** (column G `ORIG PRICE` is shown struck through).

Every product in `data/products.ts` records its `sheetRow` and `gbfSku` so any
figure can be traced back to a specific cell.

| Row | GBF SKU | Product | Size | Markdown | Orig | Group |
|---|---|---|---|---|---|---|
| 4 | 10339118 | 2-in-1 Body & Hair Cleanser | 200ml | ₱525 | ₱535 | First essentials |
| 5 | 10340773 | 2-in-1 Body & Hair Cleanser | 350ml | ₱590 | ₱625 | First essentials |
| 6 | 10339128 | 2-in-1 Body & Hair Cleanser | 750ml | ₱995 | ₱1,050 | First essentials |
| 7 | 10339114 | Gentle Shampoo | 200ml | ₱450 | ₱470 | First essentials |
| 8 | 10339121 | Gentle Shampoo | 350ml | ₱585 | ₱615 | First essentials |
| 9 | 10351560 | Diaper Change Cream | 100ml | ₱570 | ₱600 | First essentials |
| 10 | 10339120 | Nourishing & Moisturizing Cream | 100ml | ₱560 | ₱590 | Routine |
| 11 | 10340773 | Pure H2O | 350ml | ₱590 | ₱625 | First essentials |
| 12 | 10347447 | Pure H2O | 750ml | ₱960 | ₱995 | First essentials |
| 13 | 10347429 | Pure H2O Refill | 400ml | ₱610 | ₱645 | First essentials |
| 14 | 10351561 | Liquid Powder | 100ml | ₱835 | ₱880 | Routine |
| 15 | 10339131 | Stretch Marks Cream | 200ml | ₱1,130 | ₱1,190 | For Mommy |
| 16 | 10339123 | Nursing Balm | 40ml | ₱685 | ₱720 | For Mommy |
| 17 | 10339117 | Skin Freshening Fragrance | 200ml | ₱470 | ₱495 | Routine |
| 18 | 10347430 | Sweet Almond Oil Spray | 75ml | ₱495 | ₱520 | Routine |
| 19 | 10340775 | CicaBébé Organic 3-in-1 | 40ml | ₱645 | ₱680 | Just in case |
| 20 | 10339117 | Organic Arnica Gel | 20ml | ₱470 | ₱495 | Just in case |
| 21 | 10339125 | Moisturizing Body Milk | 350ml | ₱845 | ₱890 | Routine |
| 22 | 10340773 | Kids Detangling Shampoo | — | ₱590 | ₱620 | Routine |
| 23 | 10339117 | Styling Gel | 100ml | ₱470 | ₱495 | Routine |
| 24 | 10339130 | Gentle Cleansing Milk | 750ml | ₱1,090 | ₱1,150 | First essentials |
| 25 | 10339128 | Atopiane Soothing Cleansing Cream | 350ml | ₱995 | ₱1,050 | Just in case |
| 26 | 10339128 | Atopiane Protective Cleansing Oil | 350ml | ₱995 | ₱1,050 | Just in case |
| 27 | 10339131 | Atopiane Lipid-Replenishing Body Balm | 350ml | ₱1,130 | ₱1,190 | Just in case |
| 28 | 10351562 | Atopiane Emollient Face Cream | 50ml | ₱595 | ₱630 | Just in case |
| 29 | 10339121 | Cradle Cap Shampoo | 150ml | ₱585 | ₱620 | First essentials |
| 30 | 10347443 | Expert Baby Mosquito Stick | — | ₱880 | ₱895 | Out and about |
| 31 | 10339125 | Baby Sunstick SPF 50+ | — | ₱845 | ₱865 | Out and about |
| 32 | 10351563 | Extra Rich Soap | 150g | ₱330 | ₱345 | First essentials |
| 33 | 10355717 | Sun Spray | — | ₱1,630 | ₱1,850 | Out and about |
| 34 | 10340779 | Sun Cream | — | ₱795 | ₱895 | Out and about |

"—" means the sheet gives no size. GBF SKU numbers repeat across rows in the
sheet (e.g. 10340773 appears three times) — they are copied as-is.

**Placeholder artwork** (`imageIsPlaceholder: true` in `data/products.ts`):
Kids Detangling Shampoo and the Pure H2O 400ml refill are not listed on
biolane.ph, so they use a drawn stand-in SVG. The 200ml / 750ml cleanser, the
200ml shampoo and the 750ml cleansing milk reuse the 350ml packshot, and the
100ml nourishing cream shows the 200ml art — all as biolane.ph itself does.

---

## The maths behind the reward

Verified against the real 31-SKU price list (`npm run verify` — exact
subset-sum for reachable totals, 20k sampled baskets for closability):

- **₱2,299 is never exactly reachable.** Every price is a multiple of 5, so the
  real boundary is **₱2,295 (locked) → ₱2,300 (unlocked)**.
- **Cheapest qualifying basket is ₱2,300.**
- **Minimum 2 products**, but only **13 of 465** pairs qualify — each needs the
  ₱1,630 Sun Spray or two of the ₱1,000+ items. Realistic path is 3–4.
- **Any 6 products always qualify.**
- Every locked basket can be closed by adding at most 3 products, so the
  suggestion engine can never hit a dead end.
- All 31 products together come to ₱22,940.

**For the BA script:** most baskets unlock at 3–4 products. "Just one more"
is usually true once she is past ₱1,600.

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
  baby stage, due date, consent, Signed up / Finished, basket total, gift
  unlocked, bag name, and the products. Search by claim code, name, mobile or
  email; filter by Unpaid, Paid, Gift unlocked, Finished, Signed up only or
  stage. Counts on top. Refreshes itself every 30 s.
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
4. Open that URL in a browser: `{"ok":true,…}` means it's live. A Google
   sign-in page means step 3's access setting is wrong.
5. Put the URL in Vercel as `SHEETS_WEBHOOK_URL` and redeploy. Then press
   **Sync sheet** on the dashboard once: it sends every existing sign-up.

From then on every sign-up, finished checklist and Paid change appears in a
**Sign-ups** tab within seconds, one row per claim code (a finished checklist
updates its sign-up's row; a stale retry never overwrites a fresher row). If
Google is briefly unreachable, the row still saves here and is re-sent by the
dashboard's **Sync sheet** button, whenever staff have the dashboard open,
and by the daily health cron. Never reorder the sheet's columns; the script
writes them by position. Visitor-typed text is stored as plain text, so
nothing typed on the site can run as a formula in the sheet or the CSV.

**Keep the copies private.** The sheet and any downloaded CSV hold names,
mobiles, emails and due dates. Use a company Google account rather than a
personal one, share the sheet view-only with as few people as possible
(anyone who can edit the script can read the secret), delete downloaded
CSVs from booth phones after the fair, and delete the sheet when the
database is cleared. If the script was shared with editors, rotate
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

**To see or export them:** Supabase → Table Editor → `submissions`, or SQL
Editor → `select * from submissions_readable order by submitted_manila desc;`
then **Export → CSV**. The readable view shows claim code, status, Manila
time, name, relationship, email, mobile, stage, due date, consent, total,
reward, bag name and a one-line product list.

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
clear it: `delete from public.submissions where submitted_at < now() - interval '90 days';`

The stored record contains: claim code, timestamp, name, relationship (and
the "Others" text), email, mobile (normalised to `+639XXXXXXXXX`), baby stage,
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

Product packshots and the logo are downloaded from biolane.ph and served
locally from `public/images/`, so the booth never depends on a third-party CDN.
