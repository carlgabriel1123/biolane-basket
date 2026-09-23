import { adminDb } from '@/lib/admin-db'
import { hashPassword, isSameOriginPost, verifyPassword } from '@/lib/admin-auth'
import { clientIp, forgetPasswordVersion, issueSessionCookie, json, readJson, sessionSecret } from '@/lib/admin-guard'

/**
 * POST /api/admin/login — {username, password} → session cookie.
 *
 * Throttling (counted atomically in the database, so it holds across
 * server instances and parallel bursts):
 *   - 5 failures in 15 min from one device (IP + username) lock that
 *     device for 15 min. A stranger on the venue wifi therefore only locks
 *     the username for their own IP… which at a booth is the shared wifi
 *     address, so the limit is per IP *and* username, not per IP alone.
 *   - 30 failures in 15 min against the username from anywhere lock it for
 *     15 min: the brake against a distributed guess, high enough that a
 *     prankster can't switch the booth off with a handful of tries.
 * Every attempt is counted before the password is checked; a success
 * clears both counters.
 */

const DEVICE_LIMIT = 5
const USERNAME_LIMIT = 30

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

  const user = username.toLowerCase()
  const keys: Array<[string, number]> = [
    [`dev:${clientIp(request)}:${user}`, DEVICE_LIMIT],
    [`user:${user}`, USERNAME_LIMIT],
  ]
  try {
    for (const [key, limit] of keys) {
      const { allowed, locked_until } = await adminDb.throttle(key, 'attempt', limit)
      if (!allowed) return json(429, { ok: false, error: 'locked', lockedUntil: locked_until })
    }

    const account = await adminDb.getUser(username)
    const good = account ? await verifyPassword(password, account.password_hash) : (await verifyPassword(password, await decoy()), false)
    if (!good || !account) return json(401, { ok: false, error: 'bad-login' })

    await Promise.all(keys.map(([k]) => adminDb.throttle(k, 'reset')))
    forgetPasswordVersion(account.username)
    return json(
      200,
      { ok: true, username: account.username },
      { 'Set-Cookie': issueSessionCookie(request, account.username, account.password_changed_at) }
    )
  } catch (err) {
    console.error('[admin/login]', err)
    return json(503, { ok: false, error: 'store-failed' })
  }
}
