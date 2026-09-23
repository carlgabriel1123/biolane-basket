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
import { campaign, babyStages } from '../data/campaign.ts'
import { stagePlans } from '../data/stages.ts'

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

/* ---------- stage picks (data/stages.ts) ---------- */
console.log('\nStage picks:')
const ids = new Set(P.map((p) => p.id))
const priceOf = new Map(P.map((p) => [p.id, p.price]))
const stageFacts = []
const awaiting = []
for (const { value } of babyStages) {
  const plan = stagePlans[value]
  check(`stage "${value}" has a plan`, Boolean(plan))
  if (!plan || plan.picks === 'all') {
    stageFacts.push(`  ${value.padEnd(10)}: all ${n} products`)
    continue
  }
  const unknown = plan.picks.filter((id) => !ids.has(id))
  const dupes = plan.picks.filter((id, i) => plan.picks.indexOf(id) !== i)
  check(`"${value}" picks are all real product ids`, unknown.length === 0, unknown.join(', '))
  check(`"${value}" picks have no repeats`, dupes.length === 0, dupes.join(', '))
  const sum = plan.picks.reduce((s, id) => s + (priceOf.get(id) ?? 0), 0)
  check(`"${value}" picks alone can reach PHP ${T}`, sum >= T, `one of each = PHP ${sum}`)
  // fewest picks (one each) needed to unlock
  const sorted = plan.picks.map((id) => priceOf.get(id) ?? 0).sort((a, b) => b - a)
  let a = 0, k = 0
  for (const v of sorted) { a += v; k++; if (a >= T) break }
  stageFacts.push(`  ${value.padEnd(10)}: ${plan.picks.length} picks, unlock with ${k} different ones (one of each)`)

  // "You might also like" (suggestions)
  const recs = plan.suggestions ?? []
  const recUnknown = recs.filter((id) => !ids.has(id))
  const recDupes = recs.filter((id, i) => recs.indexOf(id) !== i)
  const overlap = recs.filter((id) => plan.picks.includes(id))
  check(`"${value}" suggestions are all real product ids`, recUnknown.length === 0, recUnknown.join(', '))
  check(`"${value}" suggestions have no repeats`, recDupes.length === 0, recDupes.join(', '))
  check(`"${value}" suggestions don't repeat a Checklist item`, overlap.length === 0, overlap.join(', '))
  stageFacts[stageFacts.length - 1] += `, ${recs.length} suggestions`
  const waiting = [...(plan.awaitingPrice?.picks ?? []), ...(plan.awaitingPrice?.suggestions ?? [])]
  if (waiting.length) awaiting.push(`  ${value.padEnd(10)}: ${waiting.join(', ')}`)
}
if (stagePlans.others?.picks === 'all') {
  check('"others" has no suggestions (it already shows everything)', (stagePlans.others.suggestions ?? []).length === 0)
}
// Sun and mosquito products must never be picked below 6 months (biolane.ph guidance).
const sixMonthsPlus = ['sunstick', 'suncream', 'sunspray', 'mosquito-stick']
// 'baby' is 0 to 12 months, so it includes under-6-month babies.
for (const young of ['expecting', 'baby']) {
  const plan = stagePlans[young]
  const listed = [...(Array.isArray(plan?.picks) ? plan.picks : []), ...(plan?.suggestions ?? [])]
  const bad = listed.filter((id) => sixMonthsPlus.includes(id))
  check(`"${young}" picks and suggestions exclude 6-months-plus products`, bad.length === 0, bad.join(', '))
}

/* ---------- facts ---------- */
console.log('\nFacts for the BA script:')
stageFacts.forEach((l) => console.log(l))
console.log(`  minimum products (one of each)  : ${minItems}`)
console.log(`  with quantities, fewest units   : ${Math.ceil(T / Math.max(...P.map((p) => p.price)))} (of the priciest product)`)
console.log(`  cheapest qualifying basket      : PHP ${minQual}`)
console.log(`  highest possible LOCKED total   : PHP ${maxSub}`)
console.log(
  `  qualifying ${minItems}-item baskets        : ${minCombos.count} of ${minCombos.total}`
)
console.log(`  any N products always unlock    : N >= ${guaranteedN}`)
console.log(`  all products together           : PHP ${sumAll}`)
console.log(`  all prices multiples of 5       : ${P.every((p) => p.price % 5 === 0)}`)

if (awaiting.length) {
  console.log('\nRequested but not on the fair price list (not shown until priced):')
  awaiting.forEach((l) => console.log(l))
}

console.log(failures === 0 ? '\nAll invariants hold.\n' : `\n${failures} INVARIANT(S) BROKEN.\n`)
process.exit(failures === 0 ? 0 : 1)
