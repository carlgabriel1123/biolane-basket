import { timingSafeEqual } from 'node:crypto'
import { adminDb, DbError } from '@/lib/admin-db'
import { MIN_PASSWORD_LENGTH, USERNAME_RE, hashPassword, isSameOriginPost } from '@/lib/admin-auth'
import { clientIp, issueSessionCookie, json, readJson, sessionSecret } from '@/lib/admin-guard'

/**
 * POST /api/admin/setup — creates the one admin account, first time only.
 *
 * It needs the SETUP CODE (the SETUP_SECRET env var, or ADMIN_TOKEN when
 * that isn't set), which only the site owner has, so a stranger who reaches
 * /admin before the owner — e.g. right after a password reset — can't claim
 * the account. Once a user exists this always answers 409; the database
 * also refuses a second row outright.
 */

function setupCodeOk(given: string): boolean {
  const expected = process.env.SETUP_SECRET || process.env.ADMIN_TOKEN || ''
  if (!expected) return false
  const a = Buffer.from(given.normalize('NFKC').trim())
  const b = Buffer.from(expected)
  return a.length === b.length && timingSafeEqual(a, b)
}

export async function POST(request: Request) {
  if (!isSameOriginPost(request)) return json(403, { ok: false, error: 'bad-origin' })
  if (!sessionSecret()) return json(503, { ok: false, error: 'not-configured' })

  const body = await readJson(request)
  const username = typeof body?.username === 'string' ? body.username.trim() : ''
  const password = typeof body?.password === 'string' ? body.password : ''
  const setupCode = typeof body?.setupCode === 'string' ? body.setupCode.slice(0, 200) : ''

  try {
    // Wrong codes are throttled per IP like a login, so the code can't be guessed.
    const gate = await adminDb.throttle(`setup:${clientIp(request)}`, 'attempt', 5)
    if (!gate.allowed) return json(429, { ok: false, error: 'locked', lockedUntil: gate.locked_until })
    if (!setupCodeOk(setupCode)) return json(401, { ok: false, error: 'bad-setup-code' })

    if (!USERNAME_RE.test(username)) return json(422, { ok: false, error: 'bad-username' })
    if (password.length < MIN_PASSWORD_LENGTH || password.length > 200) return json(422, { ok: false, error: 'short-password' })

    if ((await adminDb.userCount()) > 0) return json(409, { ok: false, error: 'setup-done' })
    const changedAt = await adminDb.createUser(username, await hashPassword(password))
    await adminDb.throttle(`setup:${clientIp(request)}`, 'reset')
    return json(200, { ok: true, username }, { 'Set-Cookie': issueSessionCookie(request, username, changedAt) })
  } catch (err) {
    if (err instanceof DbError && (err.detail.includes('setup already done') || err.detail.includes('23505'))) {
      return json(409, { ok: false, error: 'setup-done' })
    }
    console.error('[admin/setup]', err)
    return json(503, { ok: false, error: 'store-failed' })
  }
}
