/**
 * Basket logic tests (quantities, clamping, centavo maths, "Almost there").
 *     node scripts/test-basket.mjs
 * Runs against the saved biolane.ph copy in data/shopify-snapshot.ts.
 */
import { clampQty, computeBasket, sanitiseQuantities, setQty, suggestProducts } from '../lib/basket.ts'
import { campaign } from '../data/campaign.ts'
import { buildCatalog, indexCatalog } from '../data/products.ts'
import { shopifySnapshot } from '../data/shopify-snapshot.ts'
import { stagePlans } from '../data/stages.ts'
import { peso } from '../lib/format.ts'
import { matchListings } from '../lib/shopify-catalog.ts'

let fail = 0
const eq = (label, actual, expected) => {
  const ok = JSON.stringify(actual) === JSON.stringify(expected)
  if (!ok) fail++
  console.log(`  [${ok ? 'PASS' : 'FAIL'}] ${label}` + (ok ? '' : `  got ${JSON.stringify(actual)} want ${JSON.stringify(expected)}`))
}

const catalog = buildCatalog(shopifySnapshot)
const { productById: byId } = indexCatalog(catalog)
const price = (id) => byId.get(id).price
const MAX = campaign.maxQtyPerItem
const T = campaign.rewardThreshold
const sum = (ids) => ids.reduce((s, id) => s + price(id), 0)

/* A made-up index with round numbers, so the suggestion rules are checked
   exactly and don't shift whenever biolane.ph changes a price. */
const fake = (id, p, available = true) => ({ id, name: id, size: '', price: p, available, group: 'first', image: '', blurb: '', whyThis: '', gbfSku: '', compareAt: null, url: '', listingTitle: id })
const F = [fake('a', 300), fake('b', 500), fake('c', 700), fake('d', 1200), fake('e', 1300), fake('gone', 2500, false)]
const fakeById = new Map(F.map((p) => [p.id, p]))
const basketOf = (q, index = fakeById) => computeBasket(q, index)
const ids = (s) => s.items.map((p) => p.id)

console.log('\nQuantities:')
let q = {}
q = setQty(q, 'pure-h2o-750', 1, byId)
eq('add one', q, { 'pure-h2o-750': 1 })
q = setQty(q, 'pure-h2o-750', 2, byId)
eq('two of the same product', computeBasket(q, byId).total, price('pure-h2o-750') * 2)
eq('units counts both', computeBasket(q, byId).units, 2)
eq('count is distinct products', computeBasket(q, byId).count, 1)
q = setQty(q, 'nursing-balm-40', 3, byId)
eq('line totals', computeBasket(q, byId).lines.map((l) => l.lineTotal), [price('pure-h2o-750') * 2, price('nursing-balm-40') * 3])
eq('lines keep the order she added them', computeBasket(q, byId).lines.map((l) => l.product.id), ['pure-h2o-750', 'nursing-balm-40'])
q = setQty(q, 'pure-h2o-750', 0, byId)
eq('zero removes the product', Object.keys(q), ['nursing-balm-40'])
eq('minus below zero stays removed', setQty({}, 'pure-h2o-750', -1, byId), {})
eq(`capped at ${MAX}`, setQty({}, 'pure-h2o-750', MAX + 5, byId), { 'pure-h2o-750': MAX })
eq('unknown product ignored', setQty({}, 'not-a-product', 2, byId), {})
eq('a product with no official price cannot be added', setQty({}, 'diaper-change-cream-50', 1, byId), {})
eq('a sold-out product cannot be added', setQty({}, 'gone', 1, fakeById), {})
eq('a sold-out product already in the basket can be reduced', setQty({ gone: 2 }, 'gone', 1, fakeById), { gone: 1 })
eq('and removed', setQty({ gone: 1 }, 'gone', 0, fakeById), {})
eq('clampQty NaN → 0', clampQty(NaN), 0)
eq('clampQty fractional floors', clampQty(2.9), 2)
eq('setQty does not mutate its input', (() => { const a = { 'pure-h2o-750': 1 }; setQty(a, 'pure-h2o-750', 4, byId); return a })(), { 'pure-h2o-750': 1 })

console.log('\nCentavo maths:')
const centavos = new Map([fake('x', 772.8), fake('y', 1850.2), fake('z', 0.1)].map((p) => [p.id, p]))
eq('772.80 + 1850.20 is exactly 2623', computeBasket({ x: 1, y: 1 }, centavos).total, 2623)
eq('3 × 0.10 is exactly 0.30', computeBasket({ z: 3 }, centavos).total, 0.3)
eq('remaining is to the centavo', computeBasket({ x: 1 }, centavos).remaining, T - 772.8)
eq('peso hides whole-peso centavos', [peso(1850), peso(1850.2), peso(772.8), peso(2622.999)], ['₱1,850', '₱1,850.20', '₱772.80', '₱2,623'])

console.log('\nReward boundary with quantities:')
let r = { d: 1 } // 1200
eq('1200 is locked', basketOf(r).unlocked, false)
eq('remaining is 1099', basketOf(r).remaining, T - 1200)
r = setQty(r, 'b', 2, fakeById) // 2200
eq('2200 still locked', basketOf(r).unlocked, false)
r = setQty(r, 'a', 1, fakeById) // 2500
eq('one more unlocks', basketOf(r).unlocked, true)
eq('surplus reported, remaining 0', [basketOf(r).surplus, basketOf(r).remaining], [2500 - T, 0])

console.log('\n"Almost there" (from the Suggestions pool only):')
// gap 1099 from {d:1}: e (1300) completes alone, so it beats every pair;
// d is already chosen and 'gone' (2500) is sold out.
let s = suggestProducts(basketOf({ d: 1 }), F)
eq('one product that completes beats any pair', [ids(s), s.completes], [['e'], true])
eq('sold-out and already-chosen products are never suggested', ids(s).some((id) => id === 'gone' || id === 'd'), false)
// gap 1999 from {a:1}: singles: e (1300) no, gone excluded → pairs: d+e=2500, c+e=2000 (cheapest completing pair), c+d=1900 no
s = suggestProducts(basketOf({ a: 1 }), F)
eq('no single completes → the cheapest completing pair', [ids(s), s.completes], [['c', 'e'], true])
// gap 2299 from {}: the pair d+e=2500 completes, but the trio a+c+e=2300 is cheaper
s = suggestProducts(basketOf({}), F)
eq('the cheapest completing set wins, even with more items', [ids(s), s.completes], [['a', 'c', 'e'], true])
// gap 1100 from {d:1, a:1} (1500): single e (1300) completes; the pair b+c=1200 is cheaper but a single still wins
s = suggestProducts(basketOf({ d: 1, a: 1 }), F)
eq('a single completing product still beats a cheaper pair', [ids(s), s.completes], [['e'], true])
// a tie on total: fewer items win
s = suggestProducts(basketOf({}), [fake('p', 1200), fake('q', 1100), fake('r', 2300)])
eq('same total → fewer items', ids(s), ['r'])
// pool too small to complete: {c:1} gap 1599, pool [a, b] → closest under = a+b = 800
s = suggestProducts(basketOf({ c: 1 }), [F[0], F[1]])
eq('nothing completes → the set that gets closest, marked as not completing', [ids(s), s.completes], [['a', 'b'], false])
eq('never more than 3', suggestProducts(basketOf({}), [fake('p', 100), fake('q', 100), fake('r', 100), fake('t', 100)]).items.length, 3)
eq('deterministic', ids(suggestProducts(basketOf({ a: 1 }), F)), ids(suggestProducts(basketOf({ a: 1 }), F)))
eq('nothing suggested once unlocked', suggestProducts(basketOf(r), F).items, [])
eq('empty pool → nothing', suggestProducts(basketOf({ a: 1 }), []).items, [])
eq('everything in the pool already chosen → nothing', suggestProducts(basketOf({ a: 1, b: 1 }), [F[0], F[1]]).items, [])
eq('never falls back to products outside the pool', ids(suggestProducts(basketOf({ a: 1 }), [F[1]])), ['b'])

console.log('\nStage pools against the real store copy:')
for (const stage of ['expecting', 'baby', 'toddler']) {
  const plan = stagePlans[stage]
  const pool = plan.suggestions.map((id) => byId.get(id)).filter(Boolean)
  const picks = plan.picks.map((id) => byId.get(id)).filter((p) => p && p.available)
  // A basket of her single dearest Checklist item, then "Almost there".
  const dearest = [...picks].sort((a, b) => b.price - a.price)[0]
  const out = suggestProducts(computeBasket({ [dearest.id]: 1 }, byId), pool)
  eq(`${stage}: suggestions only come from its Suggestions list`, out.items.every((p) => plan.suggestions.includes(p.id)), true)
  eq(`${stage}: never suggests a Checklist item`, out.items.some((p) => plan.picks.includes(p.id)), false)
  eq(`${stage}: never suggests a sold-out product`, out.items.every((p) => p.available), true)
  console.log(`        ${stage}: ${out.items.map((p) => `${p.name} ${peso(p.price)}`).join(' + ')} → ${out.completes ? 'completes' : 'gets closer'} (pool of ${pool.filter((p) => p.available).length} in stock, ${plan.suggestions.length - pool.length} unpriced)`)
}
const everything = catalog.products.filter((p) => p.available)
const others = suggestProducts(computeBasket({ 'pure-h2o-750': 1 }, byId), everything)
eq('Others (no list) may use anything in stock', others.items.length > 0 && others.items.every((p) => p.available), true)

console.log('\nMatching biolane.ph listings:')
const shop = [
  { handle: 'one-size', title: 'One Size', images: [{ src: 'p.png' }], variants: [{ id: 1, title: 'Default Title', price: '100.00', compare_at_price: '120.00', available: true }] },
  { handle: 'sizes', title: 'Sizes', images: [{ src: 'p.png' }], variants: [{ id: 2, title: '50 ml', price: '50.00', compare_at_price: null, available: true, featured_image: { src: 'v50.png' } }, { id: 3, title: '100 ml', price: '99.90', compare_at_price: '90.00', available: false, featured_image: { src: 'v100.png' } }] },
]
const m = matchListings(shop, { a: { handle: 'one-size' }, b: { handle: 'sizes', variant: '100 ml' }, c: { handle: 'sizes' }, d: { handle: 'nope' }, e: { handle: 'sizes', variant: '200 ml' } })
eq('single-size listing matches without a variant', [m.listings.a.price, m.listings.a.compareAt, m.listings.a.url], [100, 120, 'https://biolane.ph/products/one-size'])
eq('a named size matches its own price, photo, stock and link', [m.listings.b.price, m.listings.b.compareAt, m.listings.b.available, m.listings.b.image, m.listings.b.url], [99.9, null, false, 'v100.png', 'https://biolane.ph/products/sizes?variant=3'])
eq('a multi-size listing without a named size is NOT matched (never the first size by accident)', 'c' in m.listings, false)
eq('missing handle, missing size and unnamed size are all reported', m.missing, ['c', 'd', 'e'])

console.log('\nRestoring a saved basket:')
eq('drops unknown ids and bad values', sanitiseQuantities({ 'pure-h2o-750': 2, ghost: 3, 'nursing-balm-40': 'x', 'rich-soap-150': 99 }, byId), { 'pure-h2o-750': 2, 'rich-soap-150': MAX })
eq('garbage in → empty basket', sanitiseQuantities('nope', byId), {})
eq('a product with no official price is dropped', sanitiseQuantities({ 'diaper-change-cream-50': 1 }, byId), {})
eq('a product taken off the site is dropped', sanitiseQuantities({ 'gentle-shampoo-200': 1, 'pure-h2o-350': 1, 'pure-h2o-400-refill': 1 }, byId), {})

console.log('\nOfficial prices (data/prices.ts), not the store:')
eq('Pure H2O 750ml is the official ₱960 with SRP ₱1,095 (biolane.ph says ₱915)', [price('pure-h2o-750'), byId.get('pure-h2o-750').compareAt], [960, 1095])
eq('2-in-1 200 / 350 / 750 / refill 750', ['cleanser-2in1-200', 'cleanser-2in1-350', 'cleanser-2in1-750', 'cleanser-2in1-refill-750'].map(price), [525, 590, 995, 970])
eq('wipes and bath powder have official prices now', ['pure-h2o-wipes-72', 'cleansing-milk-wipes-72', 'baby-powder-75'].map(price), [425, 425, 570])
eq('a product not on biolane.ph counts as in stock and has no store link', [byId.get('pure-h2o-wipes-72').available, byId.get('pure-h2o-wipes-72').url], [true, null])
const soldOutCopy = { fetchedAt: 'test', listings: { 'pure-h2o-750': { ...shopifySnapshot.listings['pure-h2o-750'], available: false } } }
const soldOut = indexCatalog(buildCatalog(soldOutCopy)).productById.get('pure-h2o-750')
eq('biolane.ph still decides sold out, the price stays official', [soldOut.available, soldOut.price], [false, 960])
eq('not on the official list → no price', ['intimate-hygiene-gel', 'diaper-change-cream-50', 'kids-detangling-shampoo'].every((id) => !byId.has(id)), true)
eq('First Teeth Toothpaste is ₱380 with nothing crossed out', [price('first-teeth-toothpaste'), byId.get('first-teeth-toothpaste').compareAt], [380, null])
eq('a product without a price still shows the store photo', catalog.unpriced.find((p) => p.id === 'intimate-hygiene-gel').image.includes('cdn.shopify.com'), true)
eq('highlighted rows are off the site', ['gentle-shampoo-200', 'pure-h2o-350', 'pure-h2o-400-refill'].every((id) => !byId.has(id) && !catalog.unpriced.some((p) => p.id === id)), true)

console.log(fail === 0 ? '\nAll basket tests pass.\n' : `\n${fail} TEST(S) FAILED.\n`)
process.exit(fail === 0 ? 0 : 1)
