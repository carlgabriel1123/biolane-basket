import type { BabyStage } from './campaign.ts'

/**
 * WHAT EACH BABY STAGE SEES — edit this file to change the lists.
 *
 * `picks`        the Checklist, top to bottom in exactly this order.
 * `suggestions`  "You might also like" — appears under the Checklist as soon
 *                as she adds her first product, in this order.
 * Everything else goes into the folded "See all Biolane products" section.
 * Use picks: 'all' to skip the lists and show the whole catalogue by category.
 *
 * Both lists are product ids from data/products.ts. The lists themselves
 * come from the Biolane team (September 2026).
 *
 * `awaitingPrice` names products the team asked for that are NOT on the fair
 * price list (LIST OF OFFERS), so they can't be sold on this page yet. They
 * are not shown. Once a fair price is confirmed, add the product to
 * data/products.ts and move its id into `picks` / `suggestions` here.
 *
 * Age guidance follows biolane.ph: the mosquito stick is "from 6 months",
 * and the sun products say to keep babies under 6 months in the shade.
 * "Baby" covers 0–12 months, so neither is listed for Expecting or Baby.
 *
 * Run `npm run verify` after editing — it fails if an id is misspelled,
 * repeated, listed twice across a stage's lists, or if a stage's checklist
 * can no longer reach the reward threshold.
 */

export interface StagePlan {
  /** Short name shown in the stage chip. */
  label: string
  /** One line under the Checklist heading. */
  caption: string
  picks: string[] | 'all'
  /** "You might also like" — shown once she adds a product. */
  suggestions: string[]
  /** Requested by the team, not on the fair price list yet. Not shown. */
  awaitingPrice?: { picks: string[]; suggestions: string[] }
}

export const stagePlans: Record<BabyStage, StagePlan> = {
  expecting: {
    label: 'Expecting',
    caption: 'For you now, and for the first weeks at home.',
    picks: [
      'pure-h2o-750',
      'cleanser-2in1-750',
      'cleanser-2in1-350',
      'cleanser-2in1-200',
      'diaper-change-cream-100',
      'nourishing-cream-100',
      'liquid-powder-100',
      'stretch-marks-cream-200',
    ],
    suggestions: ['almond-oil-spray-75', 'rich-soap-150', 'cleansing-milk-750'],
    awaitingPrice: {
      picks: ['Diaper Change Cream 50ml', 'Soothing Intimate Hygiene Gel'],
      suggestions: ['Soothing Repair Balm', 'Pure H2O Wipes x72', 'Cleansing Wipes x72'],
    },
  },
  baby: {
    label: 'Baby · 0 to 12 months',
    caption: 'Gentle everyday care from birth to their first birthday.',
    picks: [
      'pure-h2o-750',
      'cleansing-milk-750',
      'cleanser-2in1-750',
      'cleanser-2in1-350',
      'cleanser-2in1-200',
      'diaper-change-cream-100',
      'liquid-powder-100',
      'nourishing-cream-100',
      'body-milk-350',
      'gentle-shampoo-350',
    ],
    suggestions: ['cradle-cap-shampoo-150', 'cicabebe-3in1-40', 'almond-oil-spray-75', 'rich-soap-150'],
    awaitingPrice: {
      picks: [],
      suggestions: ['First Teeth Toothpaste', 'Pure H2O Wipes x72', 'Cleansing Milk Wipes x72', 'Baby Powder'],
    },
  },
  toddler: {
    label: 'Toddler · 1 to 4 years old',
    caption: 'Busy days, longer hair, and lots of time outside.',
    picks: [
      'gentle-shampoo-350',
      'cleanser-2in1-750',
      'cleanser-2in1-350',
      'body-milk-350',
      'diaper-change-cream-100',
      'liquid-powder-100',
      'skin-fragrance',
      'styling-gel-100',
      'arnica-gel-20',
      'cicabebe-3in1-40',
    ],
    suggestions: ['pure-h2o-750', 'cleansing-milk-750', 'sunstick', 'nourishing-cream-100'],
    awaitingPrice: {
      picks: [],
      suggestions: ['Pure H2O Wipes x72', 'Cleansing Milk Wipes x72'],
    },
  },
  others: {
    label: 'Others',
    caption: 'Every product at the fair, by category.',
    picks: 'all',
    suggestions: [],
  },
}
