import type { BabyStage } from './campaign.ts'

/**
 * WHAT EACH BABY STAGE SEES FIRST — edit this file to change the picks.
 *
 * `picks` is an ordered list of product ids from data/products.ts: the
 * checklist shows them top to bottom in exactly this order, and everything
 * else goes into the folded "See all Biolane products" section.
 * Use 'all' to skip the picks and show the whole catalogue by category.
 *
 * Age guidance follows biolane.ph: the mosquito stick is "from 6 months",
 * and the sun products say to keep babies under 6 months in the shade.
 * "Baby" covers 0–12 months, so it includes under-6-month babies — neither
 * is picked for Expecting or Baby. Both stay available under "See all".
 *
 * Run `npm run verify` after editing — it fails if an id is misspelled,
 * repeated, or if a stage's picks can no longer reach the reward threshold.
 */

export interface StagePlan {
  /** Short name shown in the stage chip. */
  label: string
  /** One line under the heading. */
  caption: string
  picks: string[] | 'all'
}

export const stagePlans: Record<BabyStage, StagePlan> = {
  expecting: {
    label: 'Expecting',
    caption: 'For you now, and for the first weeks at home.',
    picks: [
      'stretch-marks-cream-200',
      'nursing-balm-40',
      'pure-h2o-750',
      'cleanser-2in1-350',
      'diaper-change-cream-100',
      'body-milk-350',
      'nourishing-cream-100',
      'almond-oil-spray-75',
      'cradle-cap-shampoo-150',
      'cicabebe-3in1-40',
    ],
  },
  baby: {
    label: 'Baby · 0 to 12 months',
    caption: 'Gentle everyday care from birth to their first birthday.',
    picks: [
      'pure-h2o-750',
      'pure-h2o-400-refill',
      'cleanser-2in1-350',
      'gentle-shampoo-350',
      'cradle-cap-shampoo-150',
      'diaper-change-cream-100',
      'cleansing-milk-750',
      'body-milk-350',
      'nourishing-cream-100',
      'almond-oil-spray-75',
      'liquid-powder-100',
      'arnica-gel-20',
      'cicabebe-3in1-40',
      'nursing-balm-40',
    ],
  },
  toddler: {
    label: 'Toddler · 1 to 4 years old',
    caption: 'Busy days, longer hair, and lots of time outside.',
    picks: [
      'cleanser-2in1-750',
      'kids-detangling-shampoo',
      'styling-gel-100',
      'rich-soap-150',
      'body-milk-350',
      'skin-fragrance',
      'sunspray',
      'sunstick',
      'suncream',
      'mosquito-stick',
      'arnica-gel-20',
      'cicabebe-3in1-40',
    ],
  },
  others: {
    label: 'Others',
    caption: 'Every product at the fair, by category.',
    picks: 'all',
  },
}
