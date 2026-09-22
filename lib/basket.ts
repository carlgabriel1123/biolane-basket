import { campaign } from '@/data/campaign'
import { products, productById, type Product } from '@/data/products'

/**
 * Basket maths.
 *
 * VERIFIED FACTS about the current 31-SKU price list (scripts/verify-basket.mjs):
 *   • Every price is a multiple of 5, so ₱2,299 is NEVER exactly reachable.
 *     The real boundary is ₱2,295 (locked) → ₱2,300 (unlocked).
 *   • Cheapest qualifying basket = ₱2,300.
 *   • Minimum 2 items (only 13 of 465 pairs qualify — each needs the ₱1,630
 *     Sun Spray or two of the ₱1,000+ items); realistic path is 3–4.
 *   • Any 6 items always qualify.
 *   • Every locked basket can be closed by adding at most 3 products
 *     (checked on 20k sampled baskets plus the adversarial shapes).
 * If prices change, re-run scripts/verify-basket.mjs.
 */

export interface BasketState {
  total: number
  count: number
  remaining: number
  unlocked: boolean
  surplus: number
  selected: Product[]
}

/** Total is ALWAYS derived from the selected set — never accumulated. */
export function computeBasket(selectedIds: Set<string>): BasketState {
  const selected = products.filter((p) => selectedIds.has(p.id))
  const total = selected.reduce((sum, p) => sum + p.price, 0)
  const unlocked = total >= campaign.rewardThreshold

  return {
    total,
    count: selected.length,
    remaining: Math.max(campaign.rewardThreshold - total, 0),
    unlocked,
    surplus: Math.max(total - campaign.rewardThreshold, 0),
    selected,
  }
}

/**
 * Suggest the set of unchecked products that closes the gap with the SMALLEST
 * overshoot. Searches every unchecked subset of size 1–3 (≤129 combinations).
 *
 * Deterministic: same basket in → identical list out. Ties break by fewest
 * items, then lowest total, then catalogue order.
 */
export function suggestProducts(selectedIds: Set<string>, max = 3): Product[] {
  const { unlocked, remaining } = computeBasket(selectedIds)
  if (unlocked || remaining <= 0) return []

  const pool = products.filter((p) => !selectedIds.has(p.id))
  if (pool.length === 0) return []

  let best: { items: Product[]; overshoot: number; total: number } | null = null

  const consider = (items: Product[]) => {
    const total = items.reduce((s, p) => s + p.price, 0)
    if (total < remaining) return
    const overshoot = total - remaining
    if (
      !best ||
      overshoot < best.overshoot ||
      (overshoot === best.overshoot && items.length < best.items.length) ||
      (overshoot === best.overshoot &&
        items.length === best.items.length &&
        total < best.total)
    ) {
      best = { items, overshoot, total }
    }
  }

  const walk = (start: number, acc: Product[]) => {
    if (acc.length > 0) consider(acc)
    if (acc.length === max) return
    for (let i = start; i < pool.length; i++) walk(i + 1, [...acc, pool[i]])
  }
  walk(0, [])

  // Verified unreachable with the current price list, but never render an
  // empty suggestion box — fall back to the cheapest remaining products.
  if (!best) {
    return [...pool].sort((a, b) => a.price - b.price).slice(0, max)
  }

  const chosen: Product[] = (best as { items: Product[] }).items
  return chosen
}

/** The cheapest single product that would close the gap on its own, if any. */
export function cheapestCloser(selectedIds: Set<string>): Product | null {
  const { unlocked, remaining } = computeBasket(selectedIds)
  if (unlocked) return null
  const closers = products
    .filter((p) => !selectedIds.has(p.id) && p.price >= remaining)
    .sort((a, b) => a.price - b.price)
  return closers[0] ?? null
}

/** Resolve stored ids against the live catalogue, dropping anything removed. */
export function sanitiseIds(ids: string[]): Set<string> {
  return new Set(ids.filter((id) => productById.has(id)))
}
