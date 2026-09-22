/**
 * Basket invariant check.
 *
 * Imports the REAL data from data/products.ts and data/campaign.ts (Node
 * 22.18+ / 23.6+ strip the TypeScript natively) and asserts the facts the
 * UI copy and the BA script depend on.
 *
 * With 31 SKUs there are 2^31 baskets, so reachable totals are computed with
 * a subset-sum DP (exact) and the "any locked basket is closable" property
 * is checked on a large random sample plus the adversarial shapes.
 *
 * Run after ANY price or threshold edit:
 *     node scripts/verify-basket.mjs
 */

import { products } from '../data/products.ts'
import { campaign } from '../data/campaign.ts'

const P = products.map(({ id, name, price }) => ({ id, name, price }))
const T = campaign.rewardThreshold
const n = P.length

if (n === 0) {
  console.error('FAIL: data/products.ts exports no products')
  process.exit(1)
}

let failures = 0
const check = (label, condition, detail) => {
  if (!condition) failures++
  console.log(`  [${condition ? 'PASS' : 'FAIL'}] ${label}${detail ? ' — ' + detail : ''}`)
}

console.log(`\nProducts: ${n}   Threshold: PHP ${T}\n`)
P.forEach((p) => console.log(`  ${String(p.price).padStart(5)}  ${p.name}`))
console.log('\nInvariants:')

check('every price is a positive integer', P.every((p) => Number.isInteger(p.price) && p.price > 0))

/* ---------- exact: which totals are reachable at all (subset-sum DP) ---------- */
const sumAll = P.reduce((s, p) => s + p.price, 0)
const reachable = new Uint8Array(sumAll + 1)
reachable[0] = 1
for (const { price } of P) {
  for (let s = sumAll; s >= price; s--) if (reachable[s - price]) reachable[s] = 1
}
let minQual = -1
for (let s = T; s <= sumAll; s++) if (reachable[s]) { minQual = s; break }
let maxSub = -1
for (let s = T - 1; s >= 0; s--) if (reachable[s]) { maxSub = s; break }

check('reward is reachable at all', minQual !== -1, `all products together = PHP ${sumAll}`)
check(
  'boundary is well defined',
  maxSub < T && minQual >= T,
  `locked ceiling PHP ${maxSub}, unlocked floor PHP ${minQual}`
)

/* ---------- exact: item-count facts ---------- */
const desc = [...P].sort((a, b) => b.price - a.price)
const asc = [...P].sort((a, b) => a.price - b.price)
let acc = 0, minItems = 0
for (const p of desc) { acc += p.price; minItems++; if (acc >= T) break }
acc = 0
let guaranteedN = 0
for (const p of asc) { acc += p.price; guaranteedN++; if (acc >= T) break }
check('reward needs at least 1 item', minItems >= 1, `minimum ${minItems} products`)

// How many of the smallest-size baskets actually qualify (small enumeration).
const combos = (k) => {
  let count = 0, total = 0
  const walk = (start, depth, sum) => {
    if (depth === k) { total++; if (sum >= T) count++; return }
    for (let i = start; i < n; i++) walk(i + 1, depth + 1, sum + P[i].price)
  }
  walk(0, 0, 0)
  return { count, total }
}
const minCombos = combos(minItems)

/* ---------- sampled: every locked basket closable with <= 3 adds ---------- */
// Closability from a locked basket S depends only on the gap and the
// unchecked pool. Adversarial shapes: S made of the most expensive items
// while staying locked (pool = cheap leftovers), plus 20k random baskets.
const closable = (inIds) => {
  const sum = P.filter((p) => inIds.has(p.id)).reduce((s, p) => s + p.price, 0)
  if (sum >= T) return true
  const gap = T - sum
  const pool = P.filter((p) => !inIds.has(p.id)).map((p) => p.price).sort((a, b) => b - a)
  // Largest 3-subset sum of the pool is the top three — if that cannot close
  // the gap nothing smaller can.
  return pool.slice(0, 3).reduce((s, v) => s + v, 0) >= gap
}
let bad = 0, tested = 0
// adversarial: greedy-expensive prefixes that stay locked, over every start index
for (let start = 0; start < n; start++) {
  const ids = new Set()
  let sum = 0
  for (let i = start; i < n; i++) {
    if (sum + desc[i].price >= T) continue
    ids.add(desc[i].id)
    sum += desc[i].price
  }
  tested++
  if (!closable(ids)) bad++
}
// random
let seed = 12345
const rnd = () => (seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff
for (let r = 0; r < 20000; r++) {
  const ids = new Set()
  for (const p of P) if (rnd() < 0.5) ids.add(p.id)
  tested++
  if (!closable(ids)) bad++
}
check(
  'every locked basket is closable with <=3 additions (sampled)',
  bad === 0,
  `${tested.toLocaleString()} baskets checked, ${bad} dead ends` +
    (bad ? '' : ' — suggestion engine can always close the gap')
)

/* ---------- facts ---------- */
console.log('\nFacts for the BA script:')
console.log(`  minimum products to unlock      : ${minItems}`)
console.log(`  cheapest qualifying basket      : PHP ${minQual}`)
console.log(`  highest possible LOCKED total   : PHP ${maxSub}`)
console.log(
  `  qualifying ${minItems}-item baskets        : ${minCombos.count} of ${minCombos.total}`
)
console.log(`  any N products always unlock    : N >= ${guaranteedN}`)
console.log(`  all products together           : PHP ${sumAll}`)
console.log(`  all prices multiples of 5       : ${P.every((p) => p.price % 5 === 0)}`)

console.log(failures === 0 ? '\nAll invariants hold.\n' : `\n${failures} INVARIANT(S) BROKEN.\n`)
process.exit(failures === 0 ? 0 : 1)
