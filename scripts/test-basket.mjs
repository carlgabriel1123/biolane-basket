/**
 * Basket logic tests (quantities, clamping, suggestions).
 *     node scripts/test-basket.mjs
 */
import {
  clampQty,
  computeBasket,
  sanitiseQuantities,
  setQty,
  suggestProducts,
} from '../lib/basket.ts'
import { campaign } from '../data/campaign.ts'
import { productById, products } from '../data/products.ts'
import { stagePlans } from '../data/stages.ts'

let fail = 0
const eq = (label, actual, expected) => {
  const ok = JSON.stringify(actual) === JSON.stringify(expected)
  if (!ok) fail++
  console.log(`  [${ok ? 'PASS' : 'FAIL'}] ${label}` + (ok ? '' : `  got ${JSON.stringify(actual)} want ${JSON.stringify(expected)}`))
}
const price = (id) => productById.get(id).price
const MAX = campaign.maxQtyPerItem
const T = campaign.rewardThreshold

console.log('\nQuantities:')
let q = {}
q = setQty(q, 'pure-h2o-750', 1)
eq('add one', q, { 'pure-h2o-750': 1 })
q = setQty(q, 'pure-h2o-750', 2)
eq('two of the same product', computeBasket(q).total, price('pure-h2o-750') * 2)
eq('units counts both', computeBasket(q).units, 2)
eq('count is distinct products', computeBasket(q).count, 1)
q = setQty(q, 'nursing-balm-40', 3)
eq('line totals', computeBasket(q).lines.map((l) => l.lineTotal), [price('pure-h2o-750') * 2, price('nursing-balm-40') * 3])
eq('lines keep the order she added them', computeBasket(q).lines.map((l) => l.product.id), ['pure-h2o-750', 'nursing-balm-40'])
q = setQty(q, 'pure-h2o-750', 0)
eq('zero removes the product', Object.keys(q), ['nursing-balm-40'])
eq('minus below zero stays removed', setQty({}, 'pure-h2o-750', -1), {})
eq(`capped at ${MAX}`, setQty({}, 'pure-h2o-750', MAX + 5), { 'pure-h2o-750': MAX })
eq('unknown product ignored', setQty({}, 'not-a-product', 2), {})
eq('clampQty NaN → 0', clampQty(NaN), 0)
eq('clampQty fractional floors', clampQty(2.9), 2)
eq('setQty does not mutate its input', (() => { const a = { 'pure-h2o-750': 1 }; setQty(a, 'pure-h2o-750', 4); return a })(), { 'pure-h2o-750': 1 })

console.log('\nReward boundary with quantities:')
// 2 × Pure H2O 750 (960) = 1920; + Cleanser 350 (590) = 2510 → unlocked
let r = setQty(setQty({}, 'pure-h2o-750', 2), 'nursing-balm-40', 0)
eq('1920 is locked', computeBasket(r).unlocked, false)
eq('remaining is 379', computeBasket(r).remaining, T - 1920)
r = setQty(r, 'rich-soap-150', 1) // +330 = 2250
eq('2250 still locked', computeBasket(r).unlocked, false)
r = setQty(r, 'rich-soap-150', 2) // +660 = 2580
eq('raising qty alone can unlock', computeBasket(r).unlocked, true)
eq('surplus reported, remaining 0', [computeBasket(r).surplus, computeBasket(r).remaining], [2580 - T, 0])

console.log('\nSuggestions:')
const newbornPicks = stagePlans.newborn.picks.map((id) => productById.get(id))
const s1 = suggestProducts({}, newbornPicks)
eq('empty basket gets a suggestion set', s1.length > 0 && s1.length <= 3, true)
eq('suggestions close the gap', s1.reduce((a, p) => a + p.price, 0) >= T, true)
eq('suggestions come from her picks first', s1.every((p) => stagePlans.newborn.picks.includes(p.id)), true)
eq('deterministic', suggestProducts({}, newbornPicks).map((p) => p.id), s1.map((p) => p.id))
const s2 = suggestProducts({ 'pure-h2o-750': 1 }, newbornPicks)
eq('never suggests something already in the basket', s2.some((p) => p.id === 'pure-h2o-750'), false)
eq('nothing suggested once unlocked', suggestProducts(r, newbornPicks), [])
// every pick already chosen once, still below threshold? impossible here, so force a small pool
const tinyPool = [productById.get('rich-soap-150')]
const s3 = suggestProducts({}, tinyPool)
eq('falls back to the whole catalogue when her picks cannot close the gap', s3.length > 0 && s3.reduce((a, p) => a + p.price, 0) >= T, true)
const everythingOnce = Object.fromEntries(products.map((p) => [p.id, 1]))
eq('unlocked basket → no suggestions', suggestProducts(everythingOnce, newbornPicks).length, 0)
// Locked, and no single unchosen product closes the gap (max = 1):
// falls back to the priciest unchosen product instead of an empty box.
const soapOnly = { 'rich-soap-150': 1 } // PHP 330, gap 1969, dearest product is 1630
const priciest = [...products].filter((p) => p.id !== 'rich-soap-150').sort((a, b) => b.price - a.price)[0]
eq('no closing set → priciest unchosen instead of nothing', suggestProducts(soapOnly, [], 1).map((p) => p.id), [priciest.id])

console.log('\nRestoring a saved basket:')
eq('drops unknown ids and bad values', sanitiseQuantities({ 'pure-h2o-750': 2, ghost: 3, 'nursing-balm-40': 'x', 'rich-soap-150': 99 }), { 'pure-h2o-750': 2, 'rich-soap-150': MAX })
eq('garbage in → empty basket', sanitiseQuantities('nope'), {})

console.log(fail === 0 ? '\nAll basket tests pass.\n' : `\n${fail} TEST(S) FAILED.\n`)
process.exit(fail === 0 ? 0 : 1)
