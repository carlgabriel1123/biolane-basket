/**
 * PRODUCT DATA — what each product is called here, its group, its blurb and
 * the "Why this?" line. Prices, sale prices, stock, photos and links come
 * from biolane.ph (the Biolane Philippines Shopify store) through
 * data/shopify-map.ts: `buildCatalog` joins the two.
 *
 * A product with no biolane.ph listing (see the notes below) still shows in
 * its place on the checklist with "Price at the booth" and can't be added
 * to the basket, so nothing on the team's lists silently disappears.
 */

import type { CatalogSnapshot } from '../lib/shopify-catalog.ts'

export type ProductGroupId = 'first' | 'routine' | 'justincase' | 'outdoors' | 'mommy'

/** The curated part of a product: the same whether or not the store lists it. */
export interface ProductDef {
  id: string
  name: string
  /** Empty string when there is no size to show. */
  size: string
  group: ProductGroupId
  /** Local packshot, used when biolane.ph has no photo for it. */
  image: string
  /** Set when the local art is a stand-in for a different size or product. */
  imageIsPlaceholder?: boolean
  /** Short line under the product name. */
  blurb: string
  /** Brand Ambassador talking point, shown in the "Why this?" popover. */
  whyThis: string
  /** GBF SKU from the team's price sheet, for booth verification. '' if none. */
  gbfSku: string
  /** For the team: why the store does not list it. */
  note?: string
}

/** A product the store lists: what the basket adds up. */
export interface Product extends ProductDef {
  /** biolane.ph selling price in pesos, to the centavo. */
  price: number
  /** The crossed-out price, only when biolane.ph shows one above `price`. */
  compareAt: number | null
  /** False when biolane.ph says sold out: shown on her checklist, never suggested or added. */
  available: boolean
  /** The biolane.ph product page. */
  url: string
  /** biolane.ph's own title, for the audit. */
  listingTitle: string
}

/** A product on the team's lists that biolane.ph does not sell. */
export type UnpricedProduct = ProductDef

export type CatalogItem = Product | UnpricedProduct

export const isPriced = (p: CatalogItem): p is Product => 'price' in p

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
    caption: 'Because you need care too.',
  },
]

export const productDefs: ProductDef[] = [
  // ---------- BABY'S FIRST ESSENTIALS ----------
  {
    id: 'cleanser-2in1-200',
    name: '2-in-1 Body & Hair Cleanser',
    size: '200ml',
    gbfSku: '10339118',
    group: 'first',
    image: '/images/products/cleanser-2in1-200.jpg',
    imageIsPlaceholder: true,
    blurb: 'One gentle wash for body and hair, travel size.',
    whyThis: 'The small bottle — handy for the hospital bag or the diaper bag.',
  },
  {
    id: 'cleanser-2in1-350',
    name: '2-in-1 Body & Hair Cleanser',
    size: '350ml',
    gbfSku: '10340773',
    group: 'first',
    image: '/images/products/cleanser-2in1-350.jpg',
    blurb: 'One gentle cleanser for body and hair.',
    whyThis: "One gentle cleanser for baby's body and hair.",
  },
  {
    id: 'cleanser-2in1-750',
    name: '2-in-1 Body & Hair Cleanser',
    size: '750ml',
    gbfSku: '10339128',
    group: 'first',
    image: '/images/products/cleanser-2in1-750.jpg',
    imageIsPlaceholder: true,
    blurb: 'One gentle wash for body and hair, family size.',
    whyThis: 'The big bottle for everyday bath time — it lasts the longest.',
  },
  {
    id: 'gentle-shampoo-200',
    name: 'Gentle Shampoo',
    size: '200ml',
    gbfSku: '10339114',
    group: 'first',
    image: '/images/products/gentle-shampoo-200.png',
    imageIsPlaceholder: true,
    blurb: 'A gentle everyday shampoo, travel size.',
    whyThis: "The small one for the hospital bag or trips to Lola's.",
  },
  {
    id: 'gentle-shampoo-350',
    name: 'Gentle Shampoo',
    size: '350ml',
    gbfSku: '10339121',
    group: 'first',
    image: '/images/products/gentle-shampoo-350.png',
    blurb: "A gentle everyday shampoo for baby's fine hair.",
    whyThis: "For moms who want a separate shampoo as baby's hair grows in.",
  },
  {
    id: 'pure-h2o-750',
    name: 'Pure H2O',
    size: '750ml',
    gbfSku: '10347447',
    group: 'first',
    image: '/images/products/pure-h2o-750.png',
    blurb: 'Gentle cleansing for everyday changes.',
    whyThis: "Great to keep beside baby's changing area for everyday cleansing.",
  },
  {
    id: 'pure-h2o-400-refill',
    name: 'Pure H2O Refill',
    size: '400ml',
    gbfSku: '10347429',
    group: 'first',
    image: '/images/products/pure-h2o-400-refill.svg',
    imageIsPlaceholder: true,
    blurb: 'Refill pouch for your Pure H2O bottle.',
    whyThis: 'Tops up the bottle she already has — less plastic, same everyday cleansing.',
  },
  {
    id: 'cleansing-milk-750',
    name: 'Gentle Cleansing Milk',
    size: '750ml',
    gbfSku: '10339130',
    group: 'first',
    image: '/images/products/cleansing-milk-750.png',
    imageIsPlaceholder: true,
    blurb: 'A soft cleansing milk for face, body and diaper area.',
    whyThis: 'For quick clean-ups between baths — face, body and the diaper area.',
  },
  {
    id: 'rich-soap-150',
    name: 'Extra Rich Soap',
    size: '150g',
    gbfSku: '10351563',
    group: 'first',
    image: '/images/products/rich-soap-150.png',
    blurb: 'A gentle, creamy bar for bath time.',
    whyThis: "For moms who prefer a bar — soft lather, gentle on baby's skin.",
  },
  {
    id: 'cradle-cap-shampoo-150',
    name: 'Cradle Cap Shampoo',
    size: '150ml',
    gbfSku: '10339121',
    group: 'first',
    image: '/images/products/cradle-cap-shampoo-150.jpg',
    blurb: 'Gentle washing for the flaky-scalp phase.',
    whyThis: 'Good to have ready for the flaky-scalp phase many newborns go through.',
  },
  {
    id: 'diaper-change-cream-100',
    name: 'Diaper Change Cream',
    size: '100ml',
    gbfSku: '10351560',
    group: 'first',
    image: '/images/products/diaper-change-cream-100.png',
    blurb: "For baby's everyday diaper-care routine.",
    whyThis: "A useful addition to baby's everyday diaper-care routine.",
  },
  {
    id: 'diaper-change-cream-50',
    name: 'Diaper Change Cream',
    size: '50ml',
    gbfSku: '',
    group: 'first',
    image: '/images/products/diaper-change-cream-100.png',
    imageIsPlaceholder: true,
    blurb: 'The changing-bag size of the diaper-area cream.',
    whyThis: 'Same zinc-oxide protection as the 100ml, in a size that fits the bag.',
    note: 'biolane.ph sells the 50ml only inside bundle sets.',
  },
  {
    id: 'pure-h2o-wipes-72',
    name: 'Pure H2O Wipes',
    size: '72 wipes',
    gbfSku: '',
    group: 'first',
    image: '/images/products/pure-h2o-wipes-72.svg',
    imageIsPlaceholder: true,
    blurb: 'Thick no-rinse wipes soaked in Pure H2O.',
    whyThis: 'For the diaper area, hands and face when there is no water nearby.',
    note: 'Not on biolane.ph (official name: Lingettes épaisses H2O x72).',
  },
  {
    id: 'cleansing-milk-wipes-72',
    name: 'Cleansing Milk Wipes',
    size: '72 wipes',
    gbfSku: '',
    group: 'first',
    image: '/images/products/cleansing-milk-wipes-72.svg',
    imageIsPlaceholder: true,
    blurb: 'Milk-based wipes that clean and moisturise at each change.',
    whyThis: 'Newborn-gentle for changes on the go and messy little hands.',
  },

  // ---------- COMPLETE BABY'S ROUTINE ----------
  {
    id: 'body-milk-350',
    name: 'Moisturizing Body Milk',
    size: '350ml',
    gbfSku: '10339125',
    group: 'routine',
    image: '/images/products/body-milk-350.png',
    blurb: "Soft moisture for baby's skin after every bath.",
    whyThis: "The after-bath step — a light layer while baby's skin is still warm.",
  },
  {
    id: 'nourishing-cream-100',
    name: 'Nourishing & Moisturizing Cream',
    size: '100ml',
    gbfSku: '10339120',
    group: 'routine',
    image: '/images/products/nourishing-cream-100.png',
    imageIsPlaceholder: true,
    blurb: 'A richer texture for cheeks and little dry patches.',
    whyThis: 'Handy for face and elbows when skin feels dry — small enough for the diaper bag.',
  },
  {
    id: 'almond-oil-spray-75',
    name: 'Sweet Almond Oil Spray',
    size: '75ml',
    gbfSku: '10347430',
    group: 'routine',
    image: '/images/products/almond-oil-spray-75.jpg',
    blurb: 'Made for slow, gentle baby massage.',
    whyThis: 'This is the bonding one — a light spray in your palms, then slow strokes on baby’s arms and legs.',
  },
  {
    id: 'skin-fragrance',
    name: 'Skin Freshening Fragrance',
    size: '200ml',
    gbfSku: '10339117',
    group: 'routine',
    image: '/images/products/skin-fragrance.png',
    blurb: 'That fresh, just-bathed baby scent, any time of day.',
    whyThis: 'A light finishing mist for after bath or before visitors.',
  },
  {
    id: 'liquid-powder-100',
    name: 'Liquid Powder',
    size: '100ml',
    gbfSku: '10351561',
    group: 'routine',
    image: '/images/products/liquid-powder-100.png',
    blurb: 'Powder-free freshness for folds and creases.',
    whyThis: 'A no-dust alternative to talc — for the neck and thigh creases after a change.',
  },
  {
    id: 'styling-gel-100',
    name: 'Styling Gel',
    size: '100ml',
    gbfSku: '10339117',
    group: 'routine',
    image: '/images/products/styling-gel-100.png',
    blurb: "A soft hold for baby's first hairstyles.",
    whyThis: 'For photo days — a light gel for those first little hairstyles.',
  },
  {
    id: 'kids-detangling-shampoo',
    name: 'Kids Detangling Shampoo',
    size: '',
    gbfSku: '10340773',
    group: 'routine',
    image: '/images/products/kids-detangling-shampoo.svg',
    imageIsPlaceholder: true,
    blurb: 'Easier brushing for longer hair.',
    whyThis: 'For toddlers and big siblings — makes combing time calmer.',
    note: 'Not on biolane.ph.',
  },
  {
    id: 'first-teeth-toothpaste',
    name: 'First Teeth Toothpaste',
    size: '50ml',
    gbfSku: '',
    group: 'routine',
    image: '/images/products/first-teeth-toothpaste.svg',
    imageIsPlaceholder: true,
    blurb: "Gentle toothpaste for baby's very first teeth.",
    whyThis: 'A pea-sized amount twice a day, with a grown-up watching, from the first tooth.',
    note: 'Not on biolane.ph.',
  },
  {
    id: 'baby-powder-75',
    name: 'Baby Powder',
    size: '75g',
    gbfSku: '',
    group: 'routine',
    image: '/images/products/baby-powder-75.svg',
    imageIsPlaceholder: true,
    blurb: 'Soft natural powder for the bath and the skin folds.',
    whyThis: 'Rice, corn and oat powder — a different product from the Liquid Powder.',
    note: 'Not on biolane.ph (official name: Poudre de bain adoucissante 75g).',
  },

  // ---------- LITTLE SKIN SURPRISES HAPPEN (just in case) ----------
  {
    id: 'cicabebe-3in1-40',
    name: 'CicaBébé Organic 3-in-1',
    size: '40ml',
    gbfSku: '10340775',
    group: 'justincase',
    image: '/images/products/cicabebe-3in1-40.png',
    blurb: 'Keep it ready for localized dryness and minor skin irritation.',
    whyThis: 'A just-in-case essential for localized dryness and minor skin irritation.',
  },
  {
    id: 'arnica-gel-20',
    name: 'Organic Arnica Gel',
    size: '20ml',
    gbfSku: '10339117',
    group: 'justincase',
    image: '/images/products/arnica-gel-20.jpg',
    blurb: 'Organic arnica gel for little knocks and bumps.',
    whyThis: 'Toddler-proofing the house — for the bumps that come with learning to walk.',
  },
  {
    id: 'topilane-cleansing-cream-350',
    name: 'Topilane AD Soothing Cleansing Cream',
    size: '350ml',
    gbfSku: '10339128',
    group: 'justincase',
    image: '/images/products/atopiane-cleansing-cream-350.png',
    blurb: 'A soothing wash for very dry, atopic-prone skin.',
    whyThis: "If baby's skin runs very dry, this is the gentler wash to start with.",
  },
  {
    id: 'topilane-cleansing-oil-350',
    name: 'Topilane AD Protective Cleansing Oil',
    size: '350ml',
    gbfSku: '10339128',
    group: 'justincase',
    image: '/images/products/atopiane-cleansing-oil-350.png',
    blurb: 'A protective cleansing oil for very dry skin.',
    whyThis: 'A bath-time oil for very dry, atopic-prone skin — cleans without stripping.',
  },
  {
    id: 'topilane-body-balm-350',
    name: 'Topilane AD Lipid-Replenishing Body Balm',
    size: '350ml',
    gbfSku: '10339131',
    group: 'justincase',
    image: '/images/products/atopiane-body-balm-350.png',
    blurb: 'Rich daily balm for very dry, atopic-prone skin.',
    whyThis: 'The daily moisturiser for skin that needs more than a light milk.',
  },
  {
    id: 'topilane-face-cream-50',
    name: 'Topilane AD Emollient Face Cream',
    size: '50ml',
    gbfSku: '10351562',
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
    gbfSku: '10339125',
    group: 'outdoors',
    image: '/images/products/sunstick.png',
    blurb: 'SPF 50+ stick for nose, cheeks and ears.',
    whyThis: "The easy one — a quick swipe on baby's face before heading out.",
  },
  {
    id: 'suncream',
    name: 'Sun Cream',
    size: '',
    gbfSku: '10340779',
    group: 'outdoors',
    image: '/images/products/suncream.png',
    blurb: "High-protection sun cream for baby's body.",
    whyThis: 'For beach and pool days — apply before heading out, reapply after water.',
  },
  {
    id: 'sunspray',
    name: 'Sun Spray',
    size: '',
    gbfSku: '10355717',
    group: 'outdoors',
    image: '/images/products/sunspray.png',
    blurb: 'Easy-spray sun protection for outdoor days.',
    whyThis: 'The quick one for a wriggly baby — spray, smooth, go.',
  },
  {
    id: 'mosquito-stick',
    name: 'Expert Baby Mosquito Stick',
    size: '',
    gbfSku: '10347443',
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
    gbfSku: '10339131',
    group: 'mommy',
    image: '/images/products/stretch-marks-cream-200.png',
    blurb: 'For skin stretching through pregnancy.',
    whyThis: 'For Mommy — daily on the belly, hips and breasts while skin is stretching.',
  },
  {
    id: 'nursing-balm-40',
    name: 'Soothing Repairing Balm',
    size: '40ml',
    gbfSku: '10339123',
    group: 'mommy',
    image: '/images/products/nursing-balm-40.jpg',
    blurb: 'Comfort balm for breastfeeding moms.',
    whyThis: 'For Mommy — soothing comfort for nipples between feeds.',
  },
  {
    id: 'intimate-hygiene-gel',
    name: 'Soothing Intimate Hygiene Gel',
    size: '',
    gbfSku: '',
    group: 'mommy',
    image: '/images/products/intimate-hygiene-gel.svg',
    imageIsPlaceholder: true,
    blurb: 'Gentle daily wash for mom, during pregnancy and after.',
    whyThis: 'Soothing and gynecologically tested — made for the months when skin is extra sensitive.',
    note: 'Sold on biolane.ph as "Feminine Wash".',
  },
]

export const productDefById = new Map(productDefs.map((p) => [p.id, p]))

/** The catalogue as the site shows it: definitions joined with biolane.ph. */
export interface Catalog {
  /** Products biolane.ph lists, in the order of `productDefs`. Includes sold-out ones. */
  products: Product[]
  /** Products on the team's lists that biolane.ph does not sell. */
  unpriced: UnpricedProduct[]
  source: 'live' | 'snapshot'
  fetchedAt: string
}

export function buildCatalog(snapshot: CatalogSnapshot, source: Catalog['source'] = 'snapshot'): Catalog {
  const products: Product[] = []
  const unpriced: UnpricedProduct[] = []
  for (const def of productDefs) {
    const listing = snapshot.listings[def.id]
    if (!listing) {
      unpriced.push(def)
      continue
    }
    products.push({
      ...def,
      image: listing.image ?? def.image,
      imageIsPlaceholder: listing.image ? undefined : def.imageIsPlaceholder,
      price: listing.price,
      compareAt: listing.compareAt,
      available: listing.available,
      url: listing.url,
      listingTitle: listing.title,
    })
  }
  return { products, unpriced, source, fetchedAt: snapshot.fetchedAt }
}

export interface CatalogIndex {
  productById: Map<string, Product>
  catalogById: Map<string, CatalogItem>
}

export function indexCatalog(catalog: Catalog): CatalogIndex {
  return {
    productById: new Map(catalog.products.map((p) => [p.id, p])),
    catalogById: new Map<string, CatalogItem>(
      [...catalog.products, ...catalog.unpriced].map((p) => [p.id, p] as [string, CatalogItem])
    ),
  }
}
