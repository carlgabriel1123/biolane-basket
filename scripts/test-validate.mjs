/**
 * Validation helper tests.
 *     node scripts/test-validate.mjs
 * (Node 22.18+ / 23.6+ strip the TypeScript annotations natively; see
 *  the "engines" field in package.json.)
 */
import { normalisePhMobile, isPlausibleEmail, addDays, tidy } from '../lib/validate.ts'

let fail = 0
const eq = (label, actual, expected) => {
  const ok = actual === expected
  if (!ok) fail++
  console.log(`  [${ok ? 'PASS' : 'FAIL'}] ${label}` + (ok ? '' : `  got ${JSON.stringify(actual)} want ${JSON.stringify(expected)}`))
}

console.log('\nPH mobile — formats moms actually type:')
const E = '+639171234567'
eq('09171234567',           normalisePhMobile('09171234567'), E)
eq('0917 123 4567',         normalisePhMobile('0917 123 4567'), E)
eq('0917-123-4567',         normalisePhMobile('0917-123-4567'), E)
eq('+639171234567',         normalisePhMobile('+639171234567'), E)
eq('+63 917 123 4567 ',     normalisePhMobile('+63 917 123 4567 '), E)
eq('639171234567',          normalisePhMobile('639171234567'), E)
eq('9171234567',            normalisePhMobile('9171234567'), E)
eq('(0917) 123 4567',       normalisePhMobile('(0917) 123 4567'), E)
eq('0063 917 123 4567',     normalisePhMobile('0063 917 123 4567'), E)

console.log('\nPH mobile — must be rejected:')
eq('landline 02 8123 4567', normalisePhMobile('02 8123 4567'), null)
eq('too short',             normalisePhMobile('0917123'), null)
eq('too long',              normalisePhMobile('091712345678901'), null)
eq('non-mobile prefix 08',  normalisePhMobile('08171234567'), null)
eq('empty',                 normalisePhMobile(''), null)
eq('letters',               normalisePhMobile('not a number'), null)

console.log('\nEmail:')
eq('normal',        isPlausibleEmail('maria@example.com'), true)
eq('plus tag',      isPlausibleEmail('maria+fair@example.com.ph'), true)
eq('no @',          isPlausibleEmail('maria.example.com'), false)
eq('no dot',        isPlausibleEmail('maria@localhost'), false)
eq('has space',     isPlausibleEmail('mar ia@example.com'), false)
eq('two @',         isPlausibleEmail('a@b@example.com'), false)
eq('empty',         isPlausibleEmail(''), false)
eq('trailing dot',  isPlausibleEmail('maria@example.'), false)

console.log('\nDate maths (no timezone drift):')
eq('addDays across month', addDays('2026-09-22', 300), '2027-07-19')
eq('addDays leap year',    addDays('2028-02-28', 1), '2028-02-29')
eq('addDays year roll',    addDays('2026-12-31', 1), '2027-01-01')
eq('addDays zero',         addDays('2026-09-22', 0), '2026-09-22')

console.log('\nName tidying:')
eq('trims',        tidy('  Sofia  '), 'Sofia')
eq('collapses',    tidy('Maria   Clara'), 'Maria Clara')
eq('keeps enye',   tidy(' Niña '), 'Niña')

console.log(fail === 0 ? '\nAll validation tests pass.\n' : `\n${fail} TEST(S) FAILED.\n`)
process.exit(fail === 0 ? 0 : 1)
