/**
 * biolane.ph is a Shopify store. Its public catalogue is one JSON page:
 *   https://biolane.ph/products.json?limit=250
 * These are the pure functions that turn that page into the listings the
 * site shows (price, sale price, stock, photo, link). No server-only
 * imports, so the sync script and the tests can use them too.
 */

export const SHOP_URL = 'https://biolane.ph'
export const SHOP_PRODUCTS_URL = `${SHOP_URL}/products.json?limit=250`

/** The parts of Shopify's products.json this site reads. */
export interface ShopifyVariant {
  id: number
  title: string
  price: string
  compare_at_price: string | null
  available: boolean
  featured_image?: { src: string } | null
}

export interface ShopifyProduct {
  handle: string
  title: string
  variants: ShopifyVariant[]
  images: Array<{ src: string }>
}

/** Which biolane.ph listing a product is. `variant` is the exact variant title. */
export interface ShopifyRef {
  handle: string
  variant?: string
}

/** One product as biolane.ph sells it right now. */
export interface Listing {
  /** biolane.ph's own title (and variant), for the audit and the admin. */
  title: string
  handle: string
  variantId: number
  /** Selling price in pesos, to the centavo. */
  price: number
  /** The crossed-out price, only when it is higher than `price`. */
  compareAt: number | null
  available: boolean
  /** The variant's photo, else the listing's first photo. */
  image: string | null
  url: string
}

export interface CatalogSnapshot {
  fetchedAt: string
  listings: Record<string, Listing>
}

/** "1850.20" → 1850.2, rounded to the centavo. */
export function toPesos(s: string | null | undefined): number | null {
  if (s === null || s === undefined) return null
  const n = Number(s)
  return Number.isFinite(n) ? Math.round(n * 100) / 100 : null
}

/**
 * Pairs every product id in `map` with its live listing. Ids whose handle
 * or variant is not in the store come back in `missing` (the product then
 * shows without a price, never silently disappears). A ref without a
 * `variant` only matches a listing with a single size: if biolane.ph turns
 * that listing into several sizes, the product goes missing (and shows
 * "Ask our team") rather than quietly taking the first size's price.
 */
export function matchListings(
  shop: ShopifyProduct[],
  map: Record<string, ShopifyRef>
): { listings: Record<string, Listing>; missing: string[] } {
  const byHandle = new Map(shop.map((p) => [p.handle, p]))
  const listings: Record<string, Listing> = {}
  const missing: string[] = []

  for (const [id, ref] of Object.entries(map)) {
    const product = byHandle.get(ref.handle)
    const variant = product
      ? ref.variant
        ? product.variants.find((v) => v.title === ref.variant)
        : product.variants.length === 1
          ? product.variants[0]
          : undefined
      : undefined
    const price = variant ? toPesos(variant.price) : null
    if (!product || !variant || price === null || price <= 0) {
      missing.push(id)
      continue
    }
    const compareAt = toPesos(variant.compare_at_price)
    const multi = product.variants.length > 1 && variant.title !== 'Default Title'
    listings[id] = {
      title: multi ? `${product.title} — ${variant.title}` : product.title,
      handle: product.handle,
      variantId: variant.id,
      price,
      compareAt: compareAt !== null && compareAt > price ? compareAt : null,
      available: variant.available === true,
      image: variant.featured_image?.src ?? product.images[0]?.src ?? null,
      url: `${SHOP_URL}/products/${product.handle}${multi ? `?variant=${variant.id}` : ''}`,
    }
  }
  return { listings, missing }
}
