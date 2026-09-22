/**
 * Basket invariant check.
 *
 * Reads the REAL prices out of data/products.ts and data/campaign.ts, then
 * brute-forces every possible basket and asserts the facts the UI copy and
 * the BA script depend on.
 *
 * Run after ANY price or threshold edit:
 *     node scripts/verify-basket.mjs
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const productsSrc = fs.readFileSync(path.join(root, 'data/products.ts'), 'utf8')
const campaignSrc = fs.readFileSync(path.join(root, 'data/campaign.ts'), 'utf8')

/* ---------- pull the featured products out of the data file ---------- */
// Only top-level product entries: `id:` ... `price:` before any `otherSizes`.
const blocks = productsSrc
  .split(/\n  \{\n/)
  .slice(1)
  .map((b) => b.split('otherSizes')[0])

const P = []
for (const b of blocks) {
  const id = b.match(/id:\s*'([^']+)'/)?.[1]
  const price = Number(b.match(/\n\s*price:\s*(\d+)/)?.[1])
  const name = b.match(/name:\s*'([^']+)'/)?.[1]
  if (id && Number.isFinite(price)) P.push({ id, name, price })
}

const THRESHOLD = Number(campaignSrc.match(/rewardThreshold:\s*(\d+)/)[1])

if (P.length === 0) {
  console.error('FAIL: could not parse any products out of data/products.ts')
  process.exit(1)
}

/* ---------- brute force every basket ---------- */
const n = P.length
const all = []
for (let m = 0; m < 1 << n; m++) {
  const idx = []
  let sum = 0
  for (let i = 0; i < n; i++)
    if (m & (1 << i)) {
      idx.push(i)
      sum += P[i].price
    }
  all.push({ idx, sum, k: idx.length })
}
const qual = all.filter((b) => b.sum >= THRESHOLD)
const sub = all.filter((b) => b.sum < THRESHOLD)

/* ---------- assertions ---------- */
let failures = 0
const check = (label, condition, detail) => {
  const status = condition ? 'PASS' : 'FAIL'
  if (!condition) failures++
  console.log(`  [${status}] ${label}${detail ? ' — ' + detail : ''}`)
}

console.log(`\nProducts: ${n}   Threshold: PHP ${THRESHOLD}\n`)
P.forEach((p) => console.log(`  ${String(p.price).padStart(5)}  ${p.name}`))

console.log('\nInvariants:')

check('every price is a positive integer', P.every((p) => Number.isInteger(p.price) && p.price > 0))

check(
  'reward is reachable at all',
  qual.length > 0,
  `${qual.length} of ${all.length} baskets qualify`
)

const minQual = Math.min(...qual.map((b) => b.sum))
const maxSub = Math.max(...sub.map((b) => b.sum))
check(
  'no basket lands between maxSub and threshold',
  maxSub < THRESHOLD && minQual >= THRESHOLD,
  `locked ceiling PHP ${maxSub}, unlocked floor PHP ${minQual}`
)

const minItems = Math.min(...qual.map((b) => b.k))
check('reward needs at least 1 item', minItems >= 1, `minimum ${minItems} products`)

// The headline promise: every sub-threshold basket must be closable by the
// suggestion engine, which only searches subsets of size 1-3.
let unclosable = 0
for (const b of sub) {
  const rest = [...Array(n).keys()].filter((i) => !b.idx.includes(i))
  let ok = false
  const walk = (start, acc, depth) => {
    if (ok) return
    if (acc >= THRESHOLD - b.sum) { ok = true; return }
    if (depth === 3) return
    for (let i = start; i < rest.length; i++) walk(i + 1, acc + P[rest[i]].price, depth + 1)
  }
  walk(0, 0, 0)
  if (!ok) unclosable++
}
check(
  'every locked basket is closable with <=3 additions',
  unclosable === 0,
  unclosable === 0 ? 'suggestion engine can always close the gap' : `${unclosable} dead ends`
)

// Facts the booth copy states out loud.
const guaranteedK = [...Array(n + 1).keys()].filter(
  (k) => all.some((b) => b.k === k) && all.filter((b) => b.k === k).every((b) => b.sum >= THRESHOLD)
)
console.log('\nFacts for the BA script:')
console.log(`  minimum products to unlock      : ${minItems}`)
console.log(`  cheapest qualifying basket      : PHP ${minQual}`)
console.log(`  highest possible LOCKED total   : PHP ${maxSub}`)
console.log(
  `  qualifying ${minItems}-item baskets        : ${qual.filter((b) => b.k === minItems).length} of ${all.filter((b) => b.k === minItems).length}`
)
console.log(
  `  any N products always unlock    : N >= ${guaranteedK.length ? guaranteedK[0] : 'never'}`
)
console.log(`  all products together           : PHP ${P.reduce((s, p) => s + p.price, 0)}`)

console.log(failures === 0 ? '\nAll invariants hold.\n' : `\n${failures} INVARIANT(S) BROKEN.\n`)
process.exit(failures === 0 ? 0 : 1)
