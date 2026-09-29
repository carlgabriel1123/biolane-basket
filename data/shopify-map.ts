import type { ShopifyRef } from '../lib/shopify-catalog.ts'

/**
 * WHICH biolane.ph LISTING EACH PRODUCT IS.
 *
 * `handle` is the last part of the product's biolane.ph address; `variant`
 * is the exact size option on listings that sell several sizes. A product
 * that is not in this map (or whose listing has gone) shows on the site
 * without a price and can't be added — see data/products.ts.
 *
 * After editing, run `npm run sync-shopify`: it re-reads the store, rewrites
 * data/shopify-snapshot.ts and prints what matched and what did not.
 */
export const shopifyMap: Record<string, ShopifyRef> = {
  // Baby's first essentials
  'cleanser-2in1-200': { handle: 'biolane-baby-body-hair-wash-gel-copy-copy', variant: '200 ml' },
  'cleanser-2in1-350': { handle: 'biolane-baby-body-hair-wash-gel-copy-copy', variant: '350 ml' },
  'cleanser-2in1-750': { handle: 'biolane-baby-body-hair-wash-gel-copy-copy', variant: '750 ml' },
  'gentle-shampoo-200': { handle: 'biolane-gentle-shampoo-copy', variant: 'Biolane Gentle Shampoo 200ml' },
  'gentle-shampoo-350': { handle: 'biolane-gentle-shampoo-copy', variant: 'Biolane Gentle Shampoo 350ml' },
  'pure-h2o-350': { handle: 'biolane-pure-h2o-cleanser-copy-1', variant: 'Biolane Pure H2o 350ml' },
  'pure-h2o-750': { handle: 'pure-h2o' },
  'pure-h2o-400-refill': { handle: 'biolane-pure-h2o-cleanser-copy-1', variant: 'Biolane Pure H2o Refill' },
  'cleansing-milk-750': { handle: 'biolane-gentle-cleansing-milk-for-baby-face-body-diaper-area-750ml' },
  'rich-soap-150': { handle: 'biolane-extra-rich-soap-for-baby-150g' },
  'cradle-cap-shampoo-150': { handle: 'biolane-cradle-cap-shampoo-150ml' },
  'diaper-change-cream-100': { handle: 'diaper-change-cream' },
  'cleansing-milk-wipes-72': {
    handle: 'biolane-baby-milk-cleansing-wipes-72-sheets-wet-wipes-for-newborn-sensitive-skin-moisturizing',
  },
  // Not sold on biolane.ph (September 2026): diaper-change-cream-50, pure-h2o-wipes-72

  // Complete baby's routine
  'body-milk-350': { handle: 'biolane-moisturizing-body-milk-350ml' },
  'nourishing-cream-100': { handle: 'nourishing-and-moisturizing-cream' },
  'almond-oil-spray-75': { handle: 'biolane-sweet-almond-oil-spray-75ml' },
  'skin-fragrance': { handle: 'biolane-baby-skin-freshening-mist-200ml-gentle-citrus-floral-scent-alcohol-free' },
  'liquid-powder-100': { handle: 'biolane-liquid-talc-100ml-hypoallergenic-non-powder-formula-for-baby-s-delicate-skin' },
  'styling-gel-100': { handle: 'biolane-styling-hair-gel-100ml' },
  // Not sold on biolane.ph: kids-detangling-shampoo, first-teeth-toothpaste, baby-powder-75

  // Little skin surprises happen
  'cicabebe-3in1-40': { handle: 'biolane-cicabebe-ointment-40ml-3-in-1-soothing-healing-balm-for-baby-s-sensitive-skin' },
  'arnica-gel-20': { handle: 'biolane-organic-arnica-gel-20ml' },
  'topilane-cleansing-cream-350': {
    handle: 'biolane-topilane-ad-soothing-cleansing-cream-for-dry-to-atopic-prone-baby-skin-350ml',
  },
  'topilane-cleansing-oil-350': { handle: 'biolane-topilane-ad-protective-cleansing-oil-350ml' },
  'topilane-body-balm-350': {
    handle: 'biolane-topilane-ad-lipid-replenishing-body-balm-for-dry-to-atopic-prone-baby-skin-350ml',
  },
  'topilane-face-cream-50': { handle: 'biolane-topilane-ad-emollient-face-cream-for-babies-50ml' },

  // Out and about
  sunstick: { handle: 'biolane-baby-sunstick-spf-50' },
  suncream: { handle: 'biolane-sun-cream' },
  sunspray: { handle: 'biolane-sun-spray' },
  'mosquito-stick': { handle: 'biolane-expert-baby-mosquito-stick' },

  // For Mommy
  'stretch-marks-cream-200': { handle: 'stretch-marks-cream' },
  'nursing-balm-40': { handle: 'biolane-soothing-repairing-balm-40ml' },
  'intimate-hygiene-gel': { handle: 'feminine-wash' },
}
