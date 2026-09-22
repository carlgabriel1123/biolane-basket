/**
 * PRODUCT DATA — single source of truth for the checklist.
 *
 * Prices come from: "SKYHEGLOBAL ACTIVE SKU'S - OCTOBER 8-11.xlsx"
 *   sheet  : LIST OF OFFERS
 *   rows   : 4–34  (the E4:E34 SKU range)
 *   column : H — "MARKDOWN PRICE"   <-- this is the price we charge
 *   column : G — "ORIG PRICE"       <-- shown struck through
 *
 * To swap the featured size of a product, change `price`, `size`, `gbfSku`,
 * `sheetRow` and `origPrice` to one of the rows listed in `otherSizes`.
 * Nothing else in the app needs to change.
 */

export type ProductGroupId = 'first' | 'routine' | 'justincase'

export interface Product {
  id: string
  name: string
  size: string
  /** MARKDOWN PRICE (col H) — the amount added to the basket. */
  price: number
  /** ORIG PRICE (col G) — displayed struck through. */
  origPrice: number
  /** GBF SKU (col E) — for booth verification. */
  gbfSku: string
  /** Row in the LIST OF OFFERS sheet, for traceability. */
  sheetRow: number
  group: ProductGroupId
  image: string
  /** Set true if the artwork is a stand-in that Carl must replace. */
  imageIsPlaceholder?: boolean
  /** Short line under the product name. */
  blurb: string
  /** Brand Ambassador talking point, shown in the "Why this?" popover. */
  whyThis: string
  /** Other sizes present in the sheet — not shown, kept for easy swapping. */
  otherSizes?: Array<{ size: string; price: number; gbfSku: string; sheetRow: number }>
}

export const productGroups: Array<{
  id: ProductGroupId
  title: string
  caption?: string
}> = [
  {
    id: 'first',
    title: "Baby's first essentials",
    caption: 'The everyday basics for those first weeks at home.',
  },
  {
    id: 'routine',
    title: "Complete baby's routine",
    caption: 'Soft finishing touches after bath and changing time.',
  },
  {
    id: 'justincase',
    title: 'Little skin surprises happen',
    caption: 'A just-in-case essential, good to have ready at home.',
  },
]

export const products: Product[] = [
  // ---------- BABY'S FIRST ESSENTIALS ----------
  {
    id: 'pure-h2o-750',
    name: 'Pure H2O',
    size: '750ml',
    price: 960,
    origPrice: 995,
    gbfSku: '10347447',
    sheetRow: 12,
    group: 'first',
    image: '/images/products/pure-h2o-750.png',
    blurb: 'Gentle cleansing for everyday changes.',
    whyThis:
      "Great to keep beside baby's changing area for everyday cleansing.",
    // 350ml is intentionally excluded from the fair checklist.
    otherSizes: [{ size: '400ml (refill)', price: 610, gbfSku: '10347429', sheetRow: 13 }],
  },
  {
    id: 'cleanser-2in1-350',
    name: '2-in-1 Body & Hair Cleanser',
    size: '350ml',
    price: 590,
    origPrice: 625,
    gbfSku: '10340773',
    sheetRow: 5,
    group: 'first',
    image: '/images/products/cleanser-2in1-350.jpg',
    blurb: "One gentle cleanser for body and hair.",
    whyThis: "One gentle cleanser for baby's body and hair.",
    otherSizes: [
      { size: '200ml', price: 525, gbfSku: '10339118', sheetRow: 4 },
      { size: '750ml', price: 995, gbfSku: '10339128', sheetRow: 6 },
    ],
  },
  {
    id: 'gentle-shampoo-350',
    name: 'Gentle Shampoo',
    size: '350ml',
    price: 585,
    origPrice: 615,
    gbfSku: '10339121',
    sheetRow: 8,
    group: 'first',
    image: '/images/products/gentle-shampoo-350.png',
    blurb: "A gentle everyday shampoo for baby's fine hair.",
    whyThis: "For moms who want a separate shampoo as baby's hair grows in.",
    // 200ml is intentionally excluded from the fair checklist.
  },
  {
    id: 'diaper-change-cream-100',
    name: 'Diaper Change Cream',
    size: '100ml',
    price: 570,
    origPrice: 600,
    gbfSku: '10351560',
    sheetRow: 9,
    group: 'first',
    image: '/images/products/diaper-change-cream-100.png',
    blurb: "For baby's everyday diaper-care routine.",
    whyThis: "A useful addition to baby's everyday diaper-care routine.",
  },

  // ---------- COMPLETE BABY'S ROUTINE ----------
  {
    id: 'body-milk-350',
    name: 'Moisturizing Body Milk',
    size: '350ml',
    price: 845,
    origPrice: 890,
    gbfSku: '10339125',
    sheetRow: 21,
    group: 'routine',
    image: '/images/products/body-milk-350.png',
    blurb: "Soft moisture for baby's skin after every bath.",
    whyThis: "The after-bath step — a light layer while baby's skin is still warm.",
  },
  {
    id: 'nourishing-cream-100',
    name: 'Nourishing & Moisturizing Cream',
    size: '100ml',
    price: 560,
    origPrice: 590,
    gbfSku: '10339120',
    sheetRow: 10,
    group: 'routine',
    image: '/images/products/nourishing-cream-100.png',
    // NOTE: biolane.ph serves the 200ml artwork on the 100ml listing.
    imageIsPlaceholder: true,
    blurb: 'A richer texture for cheeks and little dry patches.',
    whyThis: "Handy for face and elbows when skin feels dry — small enough for the diaper bag.",
  },
  {
    id: 'almond-oil-spray-75',
    name: 'Sweet Almond Oil Spray',
    size: '75ml',
    price: 495,
    origPrice: 520,
    gbfSku: '10347430',
    sheetRow: 18,
    group: 'routine',
    image: '/images/products/almond-oil-spray-75.jpg',
    blurb: 'Made for slow, gentle baby massage.',
    whyThis: 'This is the bonding one — a light spray in your palms, then slow strokes on baby’s arms and legs.',
  },
  {
    id: 'skin-fragrance',
    name: 'Skin Freshening Fragrance',
    size: '200ml',
    price: 470,
    origPrice: 495,
    gbfSku: '10339117',
    sheetRow: 17,
    group: 'routine',
    image: '/images/products/skin-fragrance.png',
    blurb: 'That fresh, just-bathed baby scent, any time of day.',
    whyThis: 'A light finishing mist for after bath or before visitors.',
  },

  // ---------- JUST-IN-CASE ----------
  {
    id: 'cicabebe-3in1-40',
    name: 'CicaBébé Organic 3-in-1',
    size: '40ml',
    price: 645,
    origPrice: 680,
    gbfSku: '10340775',
    sheetRow: 19,
    group: 'justincase',
    image: '/images/products/cicabebe-3in1-40.png',
    blurb: 'Keep it ready for localized dryness and minor skin irritation.',
    whyThis:
      'A just-in-case essential for localized dryness and minor skin irritation.',
  },
]

export const productById = new Map(products.map((p) => [p.id, p]))
