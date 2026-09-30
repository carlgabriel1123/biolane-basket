/**
 * Catalogue and checklist invariant check.
 *
 * Runs against the saved biolane.ph copy (data/shopify-snapshot.ts) joined
 * with data/products.ts, and the stage lists in data/stages.ts. Asserts the
 * facts the UI copy depends on.
 *
 * Run after ANY edit to the stage lists, the product map or the threshold:
 *     node scripts/verify-basket.mjs
 */

import { buildCatalog, productDefs } from '../data/products.ts'
import { shopifySnapshot } from '../data/shopify-snapshot.ts'
import { campaign, babyStages } from '../data/campaign.ts'
import { stagePlans } from '../data/stages.ts'
import { shopifyMap } from '../data/shopify-map.ts'
import { officialPrices } from '../data/prices.ts'

const catalog = buildCatalog(shopifySnapshot)
const P = catalog.products.map(({ id, name, size, price, available }) => ({ id, name: size ? `${name} ${size}` : name, price, available }))
const inStock = P.filter((p) => p.available)
const T = campaign.rewardThreshold

let failures = 0
const check = (label, condition, detail) => {
  if (!condition) failures++
  console.log(`  [${condition ? 'PASS' : 'FAIL'}] ${label}${detail ? ' — ' + detail : ''}`)
}
const peso = (n) => '₱' + n.toLocaleString('en-PH', { minimumFractionDigits: n % 1 ? 2 : 0 })

console.log(`\nbiolane.ph copy from ${shopifySnapshot.fetchedAt}`)
console.log(`Products: ${productDefs.length} listed here, ${P.length} with an official price, ${inStock.length} in stock.   Threshold: ${peso(T)}\n`)
P.forEach((p) => console.log(`  ${peso(p.price).padStart(10)}  ${p.name}${p.available ? '' : '   (sold out)'}`))
catalog.unpriced.forEach((p) => console.log(`  ${'no price'.padStart(10)}  ${p.name}${p.size ? ' ' + p.size : ''}   (${p.note ?? 'not on the official price list'})`))

console.log('\nInvariants:')
check('every product id is unique', new Set(productDefs.map((p) => p.id)).size === productDefs.length)
const strayPrices = Object.keys(officialPrices).filter((id) => !productDefs.some((d) => d.id === id))
check('every official price belongs to a product in products.ts', strayPrices.length === 0, strayPrices.join(', '))
const badPrices = Object.entries(officialPrices).filter(([, v]) => !(Number.isInteger(v.price) && v.price > 0 && Number.isInteger(v.srp) && v.srp >= v.price))
check('every official price is whole pesos with SRP ≥ FINAL PRICE', badPrices.length === 0, badPrices.map(([id]) => id).join(', '))
const removed = ['gentle-shampoo-200', 'pure-h2o-350', 'pure-h2o-400-refill']
check('highlighted rows are off the site', removed.every((id) => !productDefs.some((d) => d.id === id)), removed.filter((id) => productDefs.some((d) => d.id === id)).join(', '))
check('every price is a positive amount', P.every((p) => p.price > 0 && Math.abs(p.price * 100 - Math.round(p.price * 100)) < 1e-6))
check('every mapped product is in products.ts', Object.keys(shopifyMap).every((id) => productDefs.some((d) => d.id === id)), Object.keys(shopifyMap).filter((id) => !productDefs.some((d) => d.id === id)).join(', '))
check('the saved copy has every mapped product', Object.keys(shopifyMap).every((id) => id in shopifySnapshot.listings), Object.keys(shopifyMap).filter((id) => !(id in shopifySnapshot.listings)).join(', '))

/* ---------- exact: which totals are reachable at all (subset-sum DP over in-stock products, in centavos) ---------- */
const C = inStock.map((p) => Math.round(p.price * 100))
const sumAll = C.reduce((s, c) => s + c, 0)
const Tc = Math.round(T * 100)
const reachable = new Uint8Array(sumAll + 1)
reachable[0] = 1
for (const c of C) for (let s = sumAll; s >= c; s--) if (reachable[s - c]) reachable[s] = 1
let minQual = -1
for (let s = Tc; s <= sumAll; s++) if (reachable[s]) { minQual = s; break }
check('reward is reachable at all', minQual !== -1, `everything in stock together = ${peso(sumAll / 100)}`)

const desc = [...inStock].sort((a, b) => b.price - a.price)
let acc = 0, minItems = 0
for (const p of desc) { acc += p.price; minItems++; if (acc >= T) break }

/* ---------- stage lists (data/stages.ts) ---------- */
console.log('\nStage lists:')
const unpricedIds = new Set(catalog.unpriced.map((p) => p.id))
const soldOutIds = new Set(P.filter((p) => !p.available).map((p) => p.id))
const ids = new Set(productDefs.map((p) => p.id))
const priceOf = new Map(P.map((p) => [p.id, p.price]))
const stageFacts = []
const awaiting = []
for (const { value } of babyStages) {
  const plan = stagePlans[value]
  check(`stage "${value}" has a plan`, Boolean(plan))
  if (!plan || plan.picks === 'all') {
    stageFacts.push(`  ${value.padEnd(10)}: all ${inStock.length} in-stock products, by category`)
    continue
  }
  const unknown = plan.picks.filter((id) => !ids.has(id))
  const dupes = plan.picks.filter((id, i) => plan.picks.indexOf(id) !== i)
  check(`"${value}" checklist ids are all real product ids`, unknown.length === 0, unknown.join(', '))
  check(`"${value}" checklist has no repeats`, dupes.length === 0, dupes.join(', '))
  check(`"${value}" checklist has 10 products`, plan.picks.length === 10, `${plan.picks.length}`)
  const addable = plan.picks.filter((id) => priceOf.has(id) && !soldOutIds.has(id))
  const sum = addable.reduce((s, id) => s + priceOf.get(id), 0)
  check(`"${value}" checklist alone (in stock) can reach ${peso(T)}`, sum >= T, `one of each = ${peso(sum)}`)

  const recs = plan.suggestions ?? []
  const recUnknown = recs.filter((id) => !ids.has(id))
  const recDupes = recs.filter((id, i) => recs.indexOf(id) !== i)
  const overlap = recs.filter((id) => plan.picks.includes(id))
  check(`"${value}" suggestions are all real product ids`, recUnknown.length === 0, recUnknown.join(', '))
  check(`"${value}" suggestions have no repeats`, recDupes.length === 0, recDupes.join(', '))
  check(`"${value}" suggestions don't repeat a Checklist item`, overlap.length === 0, overlap.join(', '))
  const pool = recs.filter((id) => priceOf.has(id) && !soldOutIds.has(id))
  const top3 = pool.map((id) => priceOf.get(id)).sort((a, b) => b - a).slice(0, 3).reduce((s, v) => s + v, 0)
  stageFacts.push(
    `  ${value.padEnd(10)}: ${plan.picks.length} on the checklist (${addable.length} addable), ${recs.length} suggestions (${pool.length} in stock; the 3 dearest add ${peso(top3)})`
  )
  const waiting = [...plan.picks, ...recs].filter((id) => unpricedIds.has(id) || soldOutIds.has(id))
  if (waiting.length) awaiting.push(`  ${value.padEnd(10)}: ${waiting.map((id) => id + (soldOutIds.has(id) ? ' (sold out)' : ' (no price)')).join(', ')}`)
}
if (stagePlans.others?.picks === 'all') {
  check('"others" has no suggestions (it may offer anything in stock)', (stagePlans.others.suggestions ?? []).length === 0)
}
// Sun and mosquito products must never be picked below 6 months (biolane.ph guidance).
const sixMonthsPlus = ['sunstick', 'suncream', 'sunspray', 'mosquito-stick']
for (const young of ['expecting', 'baby']) {
  const plan = stagePlans[young]
  const listed = [...(Array.isArray(plan?.picks) ? plan.picks : []), ...(plan?.suggestions ?? [])]
  const bad = listed.filter((id) => sixMonthsPlus.includes(id))
  check(`"${young}" checklist and suggestions exclude 6-months-plus products`, bad.length === 0, bad.join(', '))
}

console.log('\nFacts:')
stageFacts.forEach((l) => console.log(l))
console.log(`  minimum products (one of each)  : ${minItems}`)
console.log(`  cheapest qualifying basket      : ${peso(minQual / 100)}`)
console.log(`  everything in stock together    : ${peso(sumAll / 100)}`)

if (awaiting.length) {
  console.log('\nOn a stage list but not addable right now:')
  awaiting.forEach((l) => console.log(l))
}

console.log(failures === 0 ? '\nAll invariants hold.\n' : `\n${failures} INVARIANT(S) BROKEN.\n`)
process.exit(failures === 0 ? 0 : 1)
