# Biolane Nesting Checklist — Grand Baby Fair

Mobile-first microsite for the Biolane Philippines Grand Baby Fair activation.
A nesting mom scans a QR at the booth, ticks the essentials she's taking home,
watches her basket total climb toward ₱2,299, and unlocks a free personalized
toiletry bag. Then she joins the Biolane Mom Community.

Next.js 15 · TypeScript · Tailwind v4 · no external UI libraries.

```bash
npm install
npm run dev      # http://localhost:3100
npm test         # validation + basket invariants
npm run build
```

---

## What you will want to edit

Everything tweakable lives in two files. No component needs touching.

| Want to change | File | Field |
|---|---|---|
| Reward threshold | `data/campaign.ts` | `rewardThreshold` |
| Reward name | `data/campaign.ts` | `rewardName`, `rewardShortName` |
| Headline / subhead / CTA | `data/campaign.ts` | `headline`, `subheadline`, `ctaLabel` |
| Promo dates | `data/campaign.ts` | `promoDates` |
| Privacy / Terms links | `data/campaign.ts` | `privacyPolicyUrl`, `termsUrl` |
| Consent wording | `data/campaign.ts` | `consentLabel` |
| Prices, names, sizes | `data/products.ts` | `price`, `name`, `size` |
| Product blurbs / BA talking points | `data/products.ts` | `blurb`, `whyThis` |
| Product images | `public/images/products/` | replace the file, keep the name |

**After any price or threshold edit, run `npm run verify`.** It brute-forces
every possible basket and tells you if the maths still supports the copy.

### Swapping a product's featured size

Each product carries an `otherSizes` array listing the other sizes that exist
in the pricing sheet. To feature a different one, copy its `size`, `price`,
`gbfSku` and `sheetRow` up into the main fields. Nothing else changes.

---

## Where the prices came from

Source: **`SKYHEGLOBAL ACTIVE SKU'S - OCTOBER 8-11.xlsx`**
→ sheet **`LIST OF OFFERS`** → rows **4–34** (the E4:E34 SKU range)
→ column **H, `MARKDOWN PRICE`** (column G `ORIG PRICE` is shown struck through).

Every product in `data/products.ts` records its `sheetRow` and `gbfSku` so any
figure can be traced back to a specific cell.

| Product | Size | Markdown | Orig | Sheet row | GBF SKU |
|---|---|---|---|---|---|
| Pure H2O | 750ml | ₱960 | ₱995 | 12 | 10347447 |
| 2-in-1 Body & Hair Cleanser | 350ml | ₱590 | ₱625 | 5 | 10340773 |
| Gentle Shampoo | 350ml | ₱585 | ₱615 | 8 | 10339121 |
| Diaper Change Cream | 100ml | ₱570 | ₱600 | 9 | 10351560 |
| Moisturizing Body Milk | 350ml | ₱845 | ₱890 | 21 | 10339125 |
| Nourishing & Moisturizing Cream | 100ml | ₱560 | ₱590 | 10 | 10339120 |
| Sweet Almond Oil Spray | 75ml | ₱495 | ₱520 | 18 | 10347430 |
| Skin Freshening Fragrance | 200ml | ₱470 | ₱495 | 17 | 10339117 |
| CicaBébé Organic 3-in-1 | 40ml | ₱645 | ₱680 | 19 | 10340775 |

Excluded on request: Pure H2O 350ml (row 11), Gentle Shampoo 200ml (row 7).

---

## The maths behind the reward

Verified by brute-forcing all 512 baskets (`npm run verify`):

- **₱2,299 is never exactly reachable.** Every price is a multiple of 5, so the
  real boundary is **₱2,295 (locked) → ₱2,300 (unlocked)**.
- **Cheapest qualifying basket is ₱2,300** — Pure H2O + Body Milk + Almond Oil Spray.
- **Minimum 3 products**, but only **6 of 84** three-item baskets qualify, and
  all six contain *both* Pure H2O (₱960) and Body Milk (₱845).
- **Any 5 products always qualify** (cheapest five = ₱2,680).
- Every locked basket can be closed by adding at most 3 products, so the
  suggestion engine can never hit a dead end.

**For the BA script:** the realistic path is 4–5 products. Telling a mom
"just two more" is usually wrong.

---

## Connecting a real backend

Submissions currently POST to `/api/submit`, which validates and logs them.
Every lead is *also* written to `localStorage` as a safety net, so a dropped
connection at the booth never loses a signup.

To go live, open **`app/api/submit/route.ts`** and fill in the marked block —
Google Sheets (Apps Script webhook), Airtable, Supabase, or your CRM. Put
credentials in `.env.local`, server-side only, never `NEXT_PUBLIC_*`.

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

- **Start over** is available from every screen, and wipes all state in one tap.
- The basket (not the mom's details) survives a refresh for **10 minutes**.
  Personal data is never restored, so the next mom never sees the last one's.
- Submitting freezes an immutable snapshot with a **claim code** (`BIO-XXXXXXXX`).
  Unticking afterwards cannot change what staff see.
- If the network drops, the confirmation still appears with an amber
  **"Will sync"** badge. It is still a valid claim — hand over the bag.
- Consent is never pre-checked and never blocks submission.

## Assets

Product packshots and the logo are downloaded from biolane.ph and served
locally from `public/images/`, so the booth never depends on a third-party CDN.
