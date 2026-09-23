import { adminDb } from '@/lib/admin-db'
import { hashPassword, isSameOriginPost, verifyPassword } from '@/lib/admin-auth'
import { clientIp, forgetPasswordVersion, issueSessionCookie, json, readJson, sessionSecret } from '@/lib/admin-guard'

/**
 * POST /api/admin/login — {username, password} → session cookie.
 * Five wrong tries in 15 minutes lock that IP and that username for
 * 15 minutes; the counter lives in the database, so it holds everywhere.
 */

// A hash to check against when the username doesn't exist, so a wrong
// username takes as long as a wrong password.
let decoyHash: Promise<string> | null = null
const decoy = () => (decoyHash ??= hashPassword('not-a-real-password-just-timing'))

export async function POST(request: Request) {
  if (!isSameOriginPost(request)) return json(403, { ok: false, error: 'bad-origin' })
  if (!sessionSecret()) return json(503, { ok: false, error: 'not-configured' })

  const body = await readJson(request)
  const username = typeof body?.username === 'string' ? body.username.trim().slice(0, 40) : ''
  const password = typeof body?.password === 'string' ? body.password.slice(0, 200) : ''
  if (!username || !password) return json(422, { ok: false, error: 'missing' })

  const keys = [`ip:${clientIp(request)}`, `user:${username.toLowerCase()}`]
  try {
    for (const key of keys) {
      const { allowed, locked_until } = await adminDb.throttle(key, 'check')
      if (!allowed) return json(429, { ok: false, error: 'locked', lockedUntil: locked_until })
    }

    const user = await adminDb.getUser(username)
    const good = user ? await verifyPassword(password, user.password_hash) : (await verifyPassword(password, await decoy()), false)

    if (!good || !user) {
      let lockedUntil: string | null = null
      for (const key of keys) {
        const r = await adminDb.throttle(key, 'fail')
        if (!r.allowed) lockedUntil = r.locked_until
      }
      return json(401, { ok: false, error: 'bad-login', lockedUntil })
    }

    await Promise.all(keys.map((k) => adminDb.throttle(k, 'reset')))
    forgetPasswordVersion(user.username)
    return json(
      200,
      { ok: true, username: user.username },
      { 'Set-Cookie': issueSessionCookie(request, user.username, user.password_changed_at) }
    )
  } catch (err) {
    console.error('[admin/login]', err)
    return json(503, { ok: false, error: 'store-failed' })
  }
}
