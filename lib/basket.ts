import { campaign } from '../data/campaign.ts'
import type { Product } from '../data/products.ts'

/**
 * Basket maths. The basket is a map of product id → quantity; the products
 * themselves come from the catalogue the page was given (biolane.ph prices,
 * to the centavo), so every function takes that index rather than a global.
 *
 * Money is added up in centavos (integers) and reported in pesos, so
 * ₱772.80 + ₱1,850.20 is exactly ₱2,623 and never ₱2,622.9999.
 */

export type Quantities = Record<string, number>
export type ProductIndex = Map<string, Product>

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

const cents = (pesos: number) => Math.round(pesos * 100)
const pesos = (c: number) => c / 100

export function clampQty(n: number): number {
  if (!Number.isFinite(n)) return 0
  return Math.max(0, Math.min(campaign.maxQtyPerItem, Math.floor(n)))
}

/**
 * Returns a new basket with `id` set to `qty` (0 removes it). A product
 * biolane.ph says is sold out can be reduced or removed, never added.
 */
export function setQty(q: Quantities, id: string, qty: number, byId: ProductIndex): Quantities {
  const product = byId.get(id)
  if (!product) return q
  const v = clampQty(qty)
  if (!product.available && v > (q[id] ?? 0)) return q
  const next = { ...q }
  if (v === 0) delete next[id]
  else next[id] = v
  return next
}

/** Total is ALWAYS derived from the quantities — never accumulated. */
export function computeBasket(q: Quantities, byId: ProductIndex): BasketState {
  const lines: BasketLine[] = []
  let totalCents = 0
  for (const [id, qty] of Object.entries(q)) {
    const product = byId.get(id)
    if (!product || qty <= 0) continue
    const lineCents = cents(product.price) * qty
    totalCents += lineCents
    lines.push({ product, qty, lineTotal: pesos(lineCents) })
  }
  const thresholdCents = cents(campaign.rewardThreshold)
  const units = lines.reduce((s, l) => s + l.qty, 0)
  const unlocked = totalCents >= thresholdCents

  return {
    total: pesos(totalCents),
    count: lines.length,
    units,
    remaining: pesos(Math.max(thresholdCents - totalCents, 0)),
    unlocked,
    surplus: pesos(Math.max(totalCents - thresholdCents, 0)),
    lines,
  }
}

export interface Suggestion {
  items: Product[]
  /** True when adding every item unlocks the gift; false when they only get closer. */
  completes: boolean
}

const NO_SUGGESTION: Suggestion = { items: [], completes: false }

/** Every set of 1..max products from `pool`, in a fixed order. */
function forEachSet(pool: Product[], max: number, visit: (items: Product[], sumCents: number) => void): void {
  const walk = (start: number, acc: Product[], sum: number) => {
    if (acc.length > 0) visit(acc, sum)
    if (acc.length === max) return
    for (let i = start; i < pool.length; i++) walk(i + 1, [...acc, pool[i]], sum + cents(pool[i].price))
  }
  walk(0, [], 0)
}

/**
 * "Almost there": from `pool` (her stage's Suggestions list, or the whole
 * catalogue for Others), the products worth adding next. Only products
 * biolane.ph has in stock and she hasn't added yet are considered.
 *
 *   1. One product that completes the gift on its own — the cheapest such.
 *   2. Else the cheapest set of up to `max` products that completes it
 *      (fewer products only breaks a tie), so a dearer pair never beats a
 *      cheaper trio.
 *   3. Else the set (up to `max`) that gets closest to the gap: shown as
 *      "gets you closer", never as "completes".
 *   Nothing left to suggest → empty.
 *
 * Deterministic: the same basket and pool always give the same answer.
 */
export function suggestProducts(basket: BasketState, pool: Product[], max = 3): Suggestion {
  if (basket.unlocked || basket.remaining <= 0) return NO_SUGGESTION
  const chosen = new Set(basket.lines.map((l) => l.product.id))
  const candidates = pool.filter((p) => p.available && !chosen.has(p.id))
  if (candidates.length === 0) return NO_SUGGESTION

  const gap = cents(basket.remaining)
  let completing: { items: Product[]; sum: number } | null = null
  let closest: { items: Product[]; sum: number } | null = null

  forEachSet(candidates, max, (items, sum) => {
    if (sum >= gap) {
      const single = items.length === 1
      const bestIsSingle = completing !== null && completing.items.length === 1
      if (
        !completing ||
        (single && !bestIsSingle) ||
        (single === bestIsSingle &&
          (sum < completing.sum || (sum === completing.sum && items.length < completing.items.length)))
      ) {
        completing = { items: [...items], sum }
      }
    } else if (!closest || sum > closest.sum || (sum === closest.sum && items.length < closest.items.length)) {
      closest = { items: [...items], sum }
    }
  })

  if (completing) return { items: (completing as { items: Product[] }).items, completes: true }
  if (closest) return { items: (closest as { items: Product[] }).items, completes: false }
  return NO_SUGGESTION
}

/** Resolve stored quantities against the live catalogue. */
export function sanitiseQuantities(raw: unknown, byId: ProductIndex): Quantities {
  const out: Quantities = {}
  if (!raw || typeof raw !== 'object') return out
  for (const [id, qty] of Object.entries(raw as Record<string, unknown>)) {
    if (!byId.has(id) || typeof qty !== 'number') continue
    const v = clampQty(qty)
    if (v > 0) out[id] = v
  }
  return out
}
