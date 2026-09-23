// Admin login + sheet row tests. Run with:
//   node --conditions=react-server scripts/test-admin.mjs
// (`server-only` resolves to an empty module under that condition.)
import {
  createSessionToken,
  readSessionToken,
  hashPassword,
  verifyPassword,
  cookieValue,
  sessionCookieHeader,
  isSameOriginPost,
} from '../lib/admin-auth.ts'
import { toSheetRow, toCsv, formatManila, formulaSafe, localMobile, SHEET_COLUMNS } from '../lib/sheet-row.ts'

let failures = 0
const eq = (label, got, want) => {
  const ok = JSON.stringify(got) === JSON.stringify(want)
  if (!ok) failures++
  console.log(`  [${ok ? 'PASS' : 'FAIL'}] ${label}${ok ? '' : ` — got ${JSON.stringify(got)}, want ${JSON.stringify(want)}`}`)
}

console.log('Passwords:')
const hash = await hashPassword('correct horse battery')
eq('hash has the scrypt prefix', hash.startsWith('scrypt$16384$8$1$'), true)
eq('right password verifies', await verifyPassword('correct horse battery', hash), true)
eq('wrong password fails', await verifyPassword('correct horse batter', hash), false)
eq('NFKC-equivalent input verifies', await verifyPassword('correct horse battery'.normalize('NFKD'), hash), true)
eq('garbage hash fails safely', await verifyPassword('x', 'not-a-hash'), false)
eq('two hashes of one password differ (salted)', (await hashPassword('same')) === (await hashPassword('same')), false)

console.log('\nSessions:')
const secret = 's'.repeat(32)
const now = 1_800_000_000_000
const token = createSessionToken({ u: 'booth', exp: now + 1000, pv: 42 }, secret)
eq('round-trips', readSessionToken(token, secret, now), { u: 'booth', exp: now + 1000, pv: 42 })
eq('expired token rejected', readSessionToken(token, secret, now + 1000), null)
eq('wrong secret rejected', readSessionToken(token, 'x'.repeat(32), now), null)
eq('tampered body rejected', readSessionToken('e30.' + token.split('.')[1], secret, now), null)
eq('tampered signature rejected', readSessionToken(token.slice(0, -2) + 'AA', secret, now), null)
eq('empty rejected', readSessionToken(undefined, secret, now), null)
eq('cookie parsed', cookieValue('biolane_admin', 'a=1; biolane_admin=abc.def; b=2'), 'abc.def')
eq('missing cookie', cookieValue('biolane_admin', 'a=1'), undefined)
eq('secure cookie header', sessionCookieHeader('t', true), 'biolane_admin=t; Path=/; HttpOnly; SameSite=Lax; Secure; Max-Age=43200')
eq('clearing cookie', sessionCookieHeader(null, false), 'biolane_admin=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0')

const req = (h) => new Request('https://biolane.vercel.app/api/admin/paid', { method: 'POST', headers: h })
eq('same-origin POST accepted', isSameOriginPost(req({ origin: 'https://biolane.vercel.app', host: 'biolane.vercel.app', 'x-requested-with': 'biolane-admin' })), true)
eq('cross-site origin refused', isSameOriginPost(req({ origin: 'https://evil.example', host: 'biolane.vercel.app', 'x-requested-with': 'biolane-admin' })), false)
eq('missing header refused', isSameOriginPost(req({ origin: 'https://biolane.vercel.app', host: 'biolane.vercel.app' })), false)
eq('missing origin refused', isSameOriginPost(req({ host: 'biolane.vercel.app', 'x-requested-with': 'biolane-admin' })), false)
eq('forwarded host respected', isSameOriginPost(req({ origin: 'https://biolane.vercel.app', host: 'internal', 'x-forwarded-host': 'biolane.vercel.app', 'x-requested-with': 'biolane-admin' })), true)

console.log('\nSheet rows:')
const sub = {
  submission_id: 'BIO-ABC12345', event: 'checklist_completed',
  submitted_at: '2026-10-08T06:05:00.000Z', received_at: '2026-10-08T06:05:01.000Z', updated_at: '2026-10-08T06:20:00.000Z',
  name: 'Maria "Yaya" Santos', relationship: 'others', relationship_other: 'Tita', email: 'maria@example.com', mobile: '+639171234567',
  baby_stage: 'baby', due_date: null, marketing_consent: true,
  selected_products: [{ id: 'pure-h2o-750', name: 'Pure H2O', size: '750ml', gbfSku: '10347447', price: 960, qty: 2, lineTotal: 1920 }, { id: 'sunstick', name: 'Baby Sunstick SPF 50+', size: '', gbfSku: '10339125', price: 845, qty: 1, lineTotal: 845 }],
  basket_total: 2765, reward_unlocked: true, personalization_name: 'Sofia', paid_at: '2026-10-08T07:00:00.000Z', sheet_synced_at: null,
}
const row = toSheetRow(sub)
eq('Manila time', formatManila('2026-10-08T06:05:01.000Z'), '2026-10-08 14:05')
eq('status label', row.status, 'Finished')
eq('signed up uses the server time', row.signedUp, '2026-10-08 14:05')
eq('are you + specify', [row.areYou, row.othersSpecify], ['Others', 'Tita'])
eq('stage label', row.babyStage, 'Baby (0–12 months)')
eq('products one per line', row.products, 'Pure H2O 750ml ×2 = ₱1920\nBaby Sunstick SPF 50+ ×1 = ₱845')
eq('paid columns', [row.paid, row.paidAt], ['Yes', '2026-10-08 15:00'])
eq('mobile shown the local way, never as a number', row.mobile, '0917 123 4567')
eq('updated stamp carried for the sheet', row.updatedIso, '2026-10-08T06:20:00.000Z')
eq('formula-looking text is neutralised', [formulaSafe('=1+1'), formulaSafe('+63'), formulaSafe('-x'), formulaSafe('@x'), formulaSafe('\tx'), formulaSafe('Maria')], ["'=1+1", "'+63", "'-x", "'@x", "'\tx", 'Maria'])
eq('hostile name cannot become a formula in the sheet or CSV', toSheetRow({ ...sub, name: '=HYPERLINK("https://evil.example";"Maria")' }).name.startsWith("'="), true)
eq('odd mobile falls back safely', localMobile('12345'), '12345')
eq('unpaid columns', [toSheetRow({ ...sub, paid_at: null }).paid, toSheetRow({ ...sub, paid_at: null }).paidAt], ['No', ''])
eq('null due date is blank', row.dueDate, '')

const csv = toCsv([row])
const lines = csv.split('\r\n')
eq('CSV has BOM + header + row + trailing newline', [csv.charCodeAt(0), lines.length], [0xfeff, 3])
eq('CSV header matches column labels', lines[0].replace('﻿', ''), SHEET_COLUMNS.map(([, l]) => l).join(','))
eq('CSV quotes commas, quotes and newlines', lines[1].includes('"Maria ""Yaya"" Santos"') && lines[1].includes('"Pure H2O 750ml ×2 = ₱1920\nBaby Sunstick'), true)

console.log(failures === 0 ? '\nAll admin tests pass.\n' : `\n${failures} admin test(s) FAILED.\n`)
process.exit(failures === 0 ? 0 : 1)
