# Stage-based checklist with quantities — design

Approved 2026-09-23.

## Flow

Three screens inside one page, switched in place. The browser Back button
walks backwards through them.

1. **Join**: logo, the ₱2,299 reward teaser, and the existing "Welcome to the
   Biolane Mom Community" form (name, email, mobile, baby stage, due date when
   Expecting, marketing consent). Submitting saves the lead immediately, so a
   mom who stops here is still captured. Then she goes to screen 2.
2. **Checklist**: "Hi Maria". Her stage's picks come first, then a folded
   "See all Biolane products" section with the rest, grouped into categories
   that open and close. Tapping "Change" goes back to screen 1 with every
   field still filled in. Her basket is kept.
3. **Confirmation**: claim code, the reward, lines with quantities, and the
   booth instruction. Finishing re-sends the same record (same ID) with the
   basket attached.

## Stages

Expecting, Newborn (0–3m), Baby (4–12m), Toddler (1–4y), Others. Picks and
their order live in `data/stages.ts`. "Others" shows the full catalogue
by category.

Sun and mosquito products are never picked for Expecting or Newborn,
following biolane.ph's own guidance (from 6 months / keep under-6-month
babies in the shade). The Atopiane range is not in any stage's picks.

## Quantities

- A product shows **Add**. Once added it shows **− qty +**.
- Minus at 1 removes the product. The cap is `campaign.maxQtyPerItem` (10).
- The basket is `Record<productId, qty>`. The total is always derived:
  Σ price × qty, whole pesos only.
- **View basket** opens a sheet listing every line with its own stepper, the
  line totals, the total, and **Finish checklist**.
- Suggestions search her stage's unchosen picks first, falling back to the
  whole catalogue. They return the ≤3-product set with the smallest overshoot.

## State

The session (step, form, basket, personalization name, submission ID) lives
in `sessionStorage`, so a refresh keeps her place. Finishing or Start over
clears it. Nothing personal goes into `localStorage` except the lead records
kept as the offline safety net.

## Tests

- `scripts/verify-basket.mjs` checks the price facts, and for each stage that
  every picked ID exists, appears only once, and that the picks alone can
  reach the threshold.
- `scripts/test-basket.mjs` checks quantity maths, clamping, suggestion
  determinism, and the pool preference.
