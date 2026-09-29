import 'server-only'
import { buildCatalog, type Catalog } from '@/data/products'
import { shopifyMap } from '@/data/shopify-map'
import { shopifySnapshot } from '@/data/shopify-snapshot'
import { SHOP_PRODUCTS_URL, matchListings, type ShopifyProduct } from './shopify-catalog'

/** How long a fetched catalogue is reused before biolane.ph is asked again. */
export const CATALOG_REVALIDATE_SECONDS = 1800

/**
 * The catalogue the page renders: biolane.ph's prices, sale prices, stock
 * and photos, refreshed every 30 minutes. If the store can't be reached
 * or answers with a broken list, the saved copy in data/shopify-snapshot.ts
 * is used instead, so the checklist never goes blank.
 */
export async function getCatalog(): Promise<Catalog> {
  try {
    const res = await fetch(SHOP_PRODUCTS_URL, {
      next: { revalidate: CATALOG_REVALIDATE_SECONDS },
      signal: AbortSignal.timeout(8000),
    })
    if (!res.ok) throw new Error(`biolane.ph answered ${res.status}`)
    const json = (await res.json()) as { products?: ShopifyProduct[] }
    if (!Array.isArray(json.products) || json.products.length === 0) throw new Error('empty catalogue')

    const { listings, missing } = matchListings(json.products, shopifyMap)
    // A partial answer (say, half the store hidden by mistake) must not empty
    // the checklist: keep the saved copy until the store looks normal again.
    const expected = Object.keys(shopifySnapshot.listings).length
    if (Object.keys(listings).length < Math.ceil(expected * 0.8)) {
      throw new Error(`only ${Object.keys(listings).length} of ${expected} products found (missing: ${missing.join(', ')})`)
    }
    return buildCatalog({ fetchedAt: new Date().toISOString(), listings }, 'live')
  } catch (err) {
    console.error('[catalog] using the saved biolane.ph copy:', err instanceof Error ? err.message : err)
    return buildCatalog(shopifySnapshot, 'snapshot')
  }
}
