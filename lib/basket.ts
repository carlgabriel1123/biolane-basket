import { campaign } from '../data/campaign.ts'
import { products, productById } from '../data/products.ts'
import type { Product } from '../data/products.ts'

/**
 * Basket maths. The basket is a map of product id → quantity.
 *
 * VERIFIED FACTS about the current 31-SKU price list (scripts/verify-basket.mjs):
 *   • Every price is a multiple of 5, so ₱2,299 is NEVER exactly reachable.
 *     The real boundary is ₱2,295 (locked) → ₱2,300 (unlocked).
 *   • Every stage's picks can reach the threshold on their own.
 * If prices or picks change, re-run `npm run verify`.
 */

export type Quantities = Record<string, number>

export interface BasketLine {
  product: Product
  qty: number
  lineTotal: number
}

export interface BasketState {
  total: number
  /** Distinct products in the basket. */
  count: number
  /** Total units across all products. */
  units: number
  remaining: number
  unlocked: boolean
  surplus: number
  /** In the order she added them. */
  lines: BasketLine[]
}

export function clampQty(n: number): number {
  if (!Number.isFinite(n)) return 0
  return Math.max(0, Math.min(campaign.maxQtyPerItem, Math.floor(n)))
}

/** Returns a new basket with `id` set to `qty` (0 removes it). */
export function setQty(q: Quantities, id: string, qty: number): Quantities {
  if (!productById.has(id)) return q
  const next = { ...q }
  const v = clampQty(qty)
  if (v === 0) delete next[id]
  else next[id] = v
  return next
}

/** Total is ALWAYS derived from the quantities — never accumulated. */
export function computeBasket(q: Quantities): BasketState {
  const lines: BasketLine[] = []
  for (const [id, qty] of Object.entries(q)) {
    const product = productById.get(id)
    if (!product || qty <= 0) continue
    lines.push({ product, qty, lineTotal: product.price * qty })
  }
  const total = lines.reduce((s, l) => s + l.lineTotal, 0)
  const units = lines.reduce((s, l) => s + l.qty, 0)
  const unlocked = total >= campaign.rewardThreshold

  return {
    total,
    count: lines.length,
    units,
    remaining: Math.max(campaign.rewardThreshold - total, 0),
    unlocked,
    surplus: Math.max(total - campaign.rewardThreshold, 0),
    lines,
  }
}

function bestClosingSet(pool: Product[], remaining: number, max: number): Product[] | null {
  let best: { items: Product[]; overshoot: number; total: number } | null = null

  const consider = (items: Product[]) => {
    const total = items.reduce((s, p) => s + p.price, 0)
    if (total < remaining) return
    const overshoot = total - remaining
    if (
      !best ||
      overshoot < best.overshoot ||
      (overshoot === best.overshoot && items.length < best.items.length) ||
      (overshoot === best.overshoot && items.length === best.items.length && total < best.total)
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

  return best ? (best as { items: Product[] }).items : null
}

/**
 * Suggest up to `max` products she hasn't added yet that close the gap with
 * the SMALLEST overshoot. `preferred` (her stage's Checklist) is searched
 * first, then `preferred` + `secondary` (her "You might also like" list),
 * then the whole catalogue. Deterministic: same basket in → identical list out.
 */
export function suggestProducts(q: Quantities, preferred: Product[], max = 3, secondary: Product[] = []): Product[] {
  const { unlocked, remaining } = computeBasket(q)
  if (unlocked || remaining <= 0) return []

  const notChosen = (p: Product) => !(q[p.id] > 0)

  const fromPicks = bestClosingSet(preferred.filter(notChosen), remaining, max)
  if (fromPicks) return fromPicks

  if (secondary.length > 0) {
    const fromStage = bestClosingSet([...preferred, ...secondary].filter(notChosen), remaining, max)
    if (fromStage) return fromStage
  }

  const everything = products.filter(notChosen)
  const fromAll = bestClosingSet(everything, remaining, max)
  if (fromAll) return fromAll

  // Nothing unchosen can close the gap in ≤max products (she has nearly
  // everything). Never show an empty box: offer the priciest remaining ones.
  return [...everything].sort((a, b) => b.price - a.price).slice(0, max)
}

/** Resolve stored quantities against the live catalogue. */
export function sanitiseQuantities(raw: unknown): Quantities {
  const out: Quantities = {}
  if (!raw || typeof raw !== 'object') return out
  for (const [id, qty] of Object.entries(raw as Record<string, unknown>)) {
    if (!productById.has(id) || typeof qty !== 'number') continue
    const v = clampQty(qty)
    if (v > 0) out[id] = v
  }
  return out
}
