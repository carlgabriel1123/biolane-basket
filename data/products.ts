/**
 * PRODUCT DATA — single source of truth for the checklist.
 *
 * Every SKU from: "SKYHEGLOBAL ACTIVE SKU'S - OCTOBER 8-11.xlsx"
 *   sheet  : LIST OF OFFERS
 *   rows   : 4–34  (the complete E4:E34 SKU range — all 31 rows)
 *   column : H — "MARKDOWN PRICE"   <-- this is the price we charge
 *   column : G — "ORIG PRICE"       <-- shown struck through
 *
 * Each entry records its `sheetRow` and `gbfSku` so any figure traces back
 * to a cell. Images are official biolane.ph packshots served locally;
 * `imageIsPlaceholder: true` marks art that should be swapped later.
 */

export type ProductGroupId = 'first' | 'routine' | 'justincase' | 'outdoors' | 'mommy'

export interface Product {
  id: string
  name: string
  /** Empty string when the sheet gives no size. */
  size: string
  /** MARKDOWN PRICE (col H) — the amount added to the basket. */
  price: number
  /** ORIG PRICE (col G) — displayed struck through. */
  origPrice: number
  /** GBF SKU (col E) — for booth verification. Not unique in the sheet. */
  gbfSku: string
  /** Row in the LIST OF OFFERS sheet, for traceability. */
  sheetRow: number
  group: ProductGroupId
  image: string
  /** Set true if the artwork is a stand-in that should be replaced. */
  imageIsPlaceholder?: boolean
  /** Short line under the product name. */
  blurb: string
  /** Brand Ambassador talking point, shown in the "Why this?" popover. */
  whyThis: string
}

export const productGroups: Array<{
  id: ProductGroupId
  title: string
  caption?: string
}> = [
  {
    id: 'first',
    title: "Baby's first essentials",
    caption: 'Bath time, cleansing and changing — the everyday basics.',
  },
  {
    id: 'routine',
    title: "Complete baby's routine",
    caption: 'Soft finishing touches after bath and changing time.',
  },
  {
    id: 'justincase',
    title: 'Little skin surprises happen',
    caption: 'Just-in-case essentials, good to have ready at home.',
  },
  {
    id: 'outdoors',
    title: 'Out and about',
    caption: 'For sunny days, evenings outside and trips to the province.',
  },
  {
    id: 'mommy',
    title: 'For Mommy',
    caption: 'Because you are nesting too.',
  },
]

export const products: Product[] = [
  // ---------- BABY'S FIRST ESSENTIALS ----------
  {
    id: 'cleanser-2in1-200',
    name: '2-in-1 Body & Hair Cleanser',
    size: '200ml',
    price: 525,
    origPrice: 535,
    gbfSku: '10339118',
    sheetRow: 4,
    group: 'first',
    image: '/images/products/cleanser-2in1-200.jpg',
    imageIsPlaceholder: true, // 350ml art; biolane.ph has no 200ml packshot
    blurb: 'One gentle wash for body and hair, travel size.',
    whyThis: 'The small bottle — handy for the hospital bag or the diaper bag.',
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
    blurb: 'One gentle cleanser for body and hair.',
    whyThis: "One gentle cleanser for baby's body and hair.",
  },
  {
    id: 'cleanser-2in1-750',
    name: '2-in-1 Body & Hair Cleanser',
    size: '750ml',
    price: 995,
    origPrice: 1050,
    gbfSku: '10339128',
    sheetRow: 6,
    group: 'first',
    image: '/images/products/cleanser-2in1-750.jpg',
    imageIsPlaceholder: true, // 350ml art; biolane.ph has no 750ml packshot
    blurb: 'One gentle wash for body and hair, family size.',
    whyThis: 'The big bottle for everyday bath time — it lasts the longest.',
  },
  {
    id: 'gentle-shampoo-200',
    name: 'Gentle Shampoo',
    size: '200ml',
    price: 450,
    origPrice: 470,
    gbfSku: '10339114',
    sheetRow: 7,
    group: 'first',
    image: '/images/products/gentle-shampoo-200.png',
    imageIsPlaceholder: true, // 350ml art; biolane.ph has no 200ml packshot
    blurb: 'A gentle everyday shampoo, travel size.',
    whyThis: "The small one for the hospital bag or trips to Lola's.",
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
  },
  {
    id: 'pure-h2o-350',
    name: 'Pure H2O',
    size: '350ml',
    price: 590,
    origPrice: 625,
    gbfSku: '10340773',
    sheetRow: 11,
    group: 'first',
    image: '/images/products/pure-h2o-350.png',
    blurb: 'Gentle cleansing for everyday changes.',
    whyThis: 'The medium bottle — a good first size to keep beside the changing area.',
  },
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
    whyThis: "Great to keep beside baby's changing area for everyday cleansing.",
  },
  {
    id: 'pure-h2o-400-refill',
    name: 'Pure H2O Refill',
    size: '400ml',
    price: 610,
    origPrice: 645,
    gbfSku: '10347429',
    sheetRow: 13,
    group: 'first',
    image: '/images/products/pure-h2o-400-refill.svg',
    imageIsPlaceholder: true, // no refill packshot on biolane.ph
    blurb: 'Refill pouch for your Pure H2O bottle.',
    whyThis: 'Tops up the bottle she already has — less plastic, same everyday cleansing.',
  },
  {
    id: 'cleansing-milk-750',
    name: 'Gentle Cleansing Milk',
    size: '750ml',
    price: 1090,
    origPrice: 1150,
    gbfSku: '10339130',
    sheetRow: 24,
    group: 'first',
    image: '/images/products/cleansing-milk-750.png',
    imageIsPlaceholder: true, // biolane.ph serves the 350ml artwork on this listing
    blurb: 'A soft cleansing milk for face, body and diaper area.',
    whyThis: 'For quick clean-ups between baths — face, body and the diaper area.',
  },
  {
    id: 'rich-soap-150',
    name: 'Extra Rich Soap',
    size: '150g',
    price: 330,
    origPrice: 345,
    gbfSku: '10351563',
    sheetRow: 32,
    group: 'first',
    image: '/images/products/rich-soap-150.png',
    blurb: 'A gentle, creamy bar for bath time.',
    whyThis: "For moms who prefer a bar — soft lather, gentle on baby's skin.",
  },
  {
    id: 'cradle-cap-shampoo-150',
    name: 'Cradle Cap Shampoo',
    size: '150ml',
    price: 585,
    origPrice: 620,
    gbfSku: '10339121',
    sheetRow: 29,
    group: 'first',
    image: '/images/products/cradle-cap-shampoo-150.jpg',
    blurb: 'Gentle washing for the flaky-scalp phase.',
    whyThis: 'Good to have ready for the flaky-scalp phase many newborns go through.',
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
    imageIsPlaceholder: true, // biolane.ph serves the 200ml artwork on the 100ml listing
    blurb: 'A richer texture for cheeks and little dry patches.',
    whyThis: 'Handy for face and elbows when skin feels dry — small enough for the diaper bag.',
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
  {
    id: 'liquid-powder-100',
    name: 'Liquid Powder',
    size: '100ml',
    price: 835,
    origPrice: 880,
    gbfSku: '10351561',
    sheetRow: 14,
    group: 'routine',
    image: '/images/products/liquid-powder-100.png',
    blurb: 'Powder-free freshness for folds and creases.',
    whyThis: 'A no-dust alternative to talc — for the neck and thigh creases after a change.',
  },
  {
    id: 'styling-gel-100',
    name: 'Styling Gel',
    size: '100ml',
    price: 470,
    origPrice: 495,
    gbfSku: '10339117',
    sheetRow: 23,
    group: 'routine',
    image: '/images/products/styling-gel-100.png',
    blurb: "A soft hold for baby's first hairstyles.",
    whyThis: 'For photo days — a light gel for those first little hairstyles.',
  },
  {
    id: 'kids-detangling-shampoo',
    name: 'Kids Detangling Shampoo',
    size: '',
    price: 590,
    origPrice: 620,
    gbfSku: '10340773',
    sheetRow: 22,
    group: 'routine',
    image: '/images/products/kids-detangling-shampoo.svg',
    imageIsPlaceholder: true, // not listed on biolane.ph — no official packshot found
    blurb: 'Easier brushing for longer hair.',
    whyThis: 'For toddlers and big siblings — makes combing time calmer.',
  },

  // ---------- LITTLE SKIN SURPRISES HAPPEN (just in case) ----------
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
    whyThis: 'A just-in-case essential for localized dryness and minor skin irritation.',
  },
  {
    id: 'arnica-gel-20',
    name: 'Organic Arnica Gel',
    size: '20ml',
    price: 470,
    origPrice: 495,
    gbfSku: '10339117',
    sheetRow: 20,
    group: 'justincase',
    image: '/images/products/arnica-gel-20.jpg',
    blurb: 'Organic arnica gel for little knocks and bumps.',
    whyThis: 'Toddler-proofing the house — for the bumps that come with learning to walk.',
  },
  {
    id: 'atopiane-cleansing-cream-350',
    name: 'Atopiane Soothing Cleansing Cream',
    size: '350ml',
    price: 995,
    origPrice: 1050,
    gbfSku: '10339128',
    sheetRow: 25,
    group: 'justincase',
    image: '/images/products/atopiane-cleansing-cream-350.png',
    blurb: 'A soothing wash for very dry, atopic-prone skin.',
    whyThis: "If baby's skin runs very dry, this is the gentler wash to start with.",
  },
  {
    id: 'atopiane-cleansing-oil-350',
    name: 'Atopiane Protective Cleansing Oil',
    size: '350ml',
    price: 995,
    origPrice: 1050,
    gbfSku: '10339128',
    sheetRow: 26,
    group: 'justincase',
    image: '/images/products/atopiane-cleansing-oil-350.png',
    blurb: 'A protective cleansing oil for very dry skin.',
    whyThis: 'A bath-time oil for very dry, atopic-prone skin — cleans without stripping.',
  },
  {
    id: 'atopiane-body-balm-350',
    name: 'Atopiane Lipid-Replenishing Body Balm',
    size: '350ml',
    price: 1130,
    origPrice: 1190,
    gbfSku: '10339131',
    sheetRow: 27,
    group: 'justincase',
    image: '/images/products/atopiane-body-balm-350.png',
    blurb: 'Rich daily balm for very dry, atopic-prone skin.',
    whyThis: 'The daily moisturiser for skin that needs more than a light milk.',
  },
  {
    id: 'atopiane-face-cream-50',
    name: 'Atopiane Emollient Face Cream',
    size: '50ml',
    price: 595,
    origPrice: 630,
    gbfSku: '10351562',
    sheetRow: 28,
    group: 'justincase',
    image: '/images/products/atopiane-face-cream-50.png',
    blurb: 'A rich face cream for very dry cheeks.',
    whyThis: 'A small tube just for the face — for cheeks that go dry and rough.',
  },

  // ---------- OUT AND ABOUT ----------
  {
    id: 'sunstick',
    name: 'Baby Sunstick SPF 50+',
    size: '',
    price: 845,
    origPrice: 865,
    gbfSku: '10339125',
    sheetRow: 31,
    group: 'outdoors',
    image: '/images/products/sunstick.png',
    blurb: 'SPF 50+ stick for nose, cheeks and ears.',
    whyThis: "The easy one — a quick swipe on baby's face before heading out.",
  },
  {
    id: 'suncream',
    name: 'Sun Cream',
    size: '',
    price: 795,
    origPrice: 895,
    gbfSku: '10340779',
    sheetRow: 34,
    group: 'outdoors',
    image: '/images/products/suncream.png',
    blurb: "High-protection sun cream for baby's body.",
    whyThis: 'For beach and pool days — apply before heading out, reapply after water.',
  },
  {
    id: 'sunspray',
    name: 'Sun Spray',
    size: '',
    price: 1630,
    origPrice: 1850,
    gbfSku: '10355717',
    sheetRow: 33,
    group: 'outdoors',
    image: '/images/products/sunspray.png',
    blurb: 'Easy-spray sun protection for outdoor days.',
    whyThis: 'The quick one for a wriggly baby — spray, smooth, go.',
  },
  {
    id: 'mosquito-stick',
    name: 'Expert Baby Mosquito Stick',
    size: '',
    price: 880,
    origPrice: 895,
    gbfSku: '10347443',
    sheetRow: 30,
    group: 'outdoors',
    image: '/images/products/mosquito-stick.png',
    blurb: 'Plant-origin mosquito protection, from 6 months.',
    whyThis: 'For evenings outside and trips to the province — a swipe on exposed skin.',
  },

  // ---------- FOR MOMMY ----------
  {
    id: 'stretch-marks-cream-200',
    name: 'Stretch Marks Cream',
    size: '200ml',
    price: 1130,
    origPrice: 1190,
    gbfSku: '10339131',
    sheetRow: 15,
    group: 'mommy',
    image: '/images/products/stretch-marks-cream-200.png',
    blurb: 'For skin stretching through pregnancy.',
    whyThis: 'For Mommy — daily on the belly, hips and breasts while skin is stretching.',
  },
  {
    id: 'nursing-balm-40',
    name: 'Nursing Balm',
    size: '40ml',
    price: 685,
    origPrice: 720,
    gbfSku: '10339123',
    sheetRow: 16,
    group: 'mommy',
    image: '/images/products/nursing-balm-40.jpg',
    blurb: 'Comfort balm for breastfeeding moms.',
    whyThis: 'For Mommy — soothing comfort for nipples between feeds.',
  },
]

export const productById = new Map(products.map((p) => [p.id, p]))
