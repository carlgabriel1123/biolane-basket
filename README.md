# Biolane Nesting Checklist — Grand Baby Fair

Mobile-first microsite for the Biolane Philippines Grand Baby Fair activation.
A mom scans a QR at the booth and:

1. **Joins the Biolane Mom Community** — name, email, mobile, baby stage,
   due date if expecting, optional marketing consent. Her lead is saved the
   moment she submits.
2. **Builds her checklist** — the products picked for her baby stage come
   first, everything else is folded under "See all". Each product has
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
| Stage headings on the checklist | `data/stages.ts` | `title`, `caption` |
| Baby stage options on the form | `data/campaign.ts` | `babyStages` |
| Reward threshold | `data/campaign.ts` | `rewardThreshold` |
| Most units of one product per mom | `data/campaign.ts` | `maxQtyPerItem` |
| Reward name | `data/campaign.ts` | `rewardName`, `rewardShortName` |
| Sign-up button text | `data/campaign.ts` | `joinCtaLabel` |
| Community heading and copy | `data/campaign.ts` | `communityHeading`, `communityCopy` |
| Promo dates | `data/campaign.ts` | `promoDates` |
| Privacy / Terms links | `data/campaign.ts` | `privacyPolicyUrl`, `termsUrl` |
| Consent wording | `data/campaign.ts` | `consentLabel` |
| Prices, names, sizes | `data/products.ts` | `price`, `name`, `size` |
| Product blurbs / BA talking points | `data/products.ts` | `blurb`, `whyThis` |
| Product images | `public/images/products/` | replace the file, keep the name |

**After any price, threshold, or picks edit, run `npm run verify`.** It fails
if a pick is misspelled or repeated, if a stage's picks can no longer reach
the reward, or if a sun or mosquito product is picked for Expecting or Newborn.

### What each stage sees first

| Stage | Picks (in order) |
|---|---|
| Expecting | Stretch Marks Cream, Nursing Balm, Pure H2O 750ml, 2-in-1 Cleanser 350ml, Diaper Change Cream, Body Milk, Nourishing Cream, Almond Oil Spray, Cradle Cap Shampoo, CicaBébé |
| Newborn 0–3m | Pure H2O 750ml, Pure H2O Refill, 2-in-1 Cleanser 350ml, Cradle Cap Shampoo, Cleansing Milk, Diaper Change Cream, Body Milk, Nourishing Cream, Almond Oil Spray, Liquid Powder, CicaBébé, Nursing Balm |
| Baby 4–12m | Pure H2O 750ml, 2-in-1 Cleanser 750ml, Gentle Shampoo 350ml, Diaper Change Cream, Body Milk, Nourishing Cream, Almond Oil Spray, Skin Fragrance, Sunstick, Sun Cream, Mosquito Stick, Arnica Gel, CicaBébé |
| Toddler 1–4y | 2-in-1 Cleanser 750ml, Kids Detangling Shampoo, Styling Gel, Extra Rich Soap, Body Milk, Skin Fragrance, Sun Spray, Sunstick, Sun Cream, Mosquito Stick, Arnica Gel, CicaBébé |
| Others | All 31 products, by category |

Sun and mosquito products are never picked for Expecting or Newborn:
biolane.ph says the mosquito stick is "from 6 months" and to keep babies
under 6 months in the shade.

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

Live at **https://carlgabriel1123.github.io/biolane-basket/**

Every push to `main` runs `.github/workflows/deploy.yml`: it runs the tests,
builds a static export, and publishes it to GitHub Pages. Nothing to do by hand.
Watch it at https://github.com/carlgabriel1123/biolane-basket/actions.

The site is served from the `/biolane-basket/` sub-path; `next.config.mjs`
sets that from the repo name. Rename the repo → update `repoName` there.

## Connecting a real backend

This is a static site with no server of its own, so submissions go to a
webhook you provide. Set it as a repository secret named
`NEXT_PUBLIC_SUBMIT_WEBHOOK_URL` (Settings → Secrets → Actions) and add it to
the build step in `deploy.yml`, or put it in `.env.local` for local runs:

```
NEXT_PUBLIC_SUBMIT_WEBHOOK_URL=https://script.google.com/macros/s/…/exec
```

Anything that accepts a JSON POST works: a Google Apps Script web app writing
to a Sheet, an n8n / Make / Zapier webhook, or a small edge function in front
of Airtable or Supabase. See the comment block in `lib/submission.ts`.

Until a webhook is set, every lead is kept in the phone's `localStorage` and
the confirmation screen shows "Will sync" instead of "Saved". A dropped
connection at the booth never loses a signup either way.

The stored record contains: submission ID, timestamp, name, email, mobile
(normalised to `+639XXXXXXXXX`), baby stage, due date (only when Expecting),
marketing consent, selected products with SKUs and prices, basket total,
reward-unlocked flag, personalization name.

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
  tab (`sessionStorage`). Finishing or Start over clears it, so the next mom
  never sees the last one's details.
- **Change** next to her stage goes back to the sign-up with every field
  filled in. Her basket is kept. The phone's Back button walks back the same way.
- One record per mom: it is saved on sign-up and updated on finish with the
  same **claim code** (`BIO-XXXXXXXX`). Changing the basket afterwards
  cannot change what staff see.
- If the network drops, the confirmation still appears with an amber
  **"Will sync"** badge. It is still a valid claim — hand over the bag.
- Consent is never pre-checked and never blocks submission.

## Assets

Product packshots and the logo are downloaded from biolane.ph and served
locally from `public/images/`, so the booth never depends on a third-party CDN.
