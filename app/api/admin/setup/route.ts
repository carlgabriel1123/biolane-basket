import { adminDb, DbError } from '@/lib/admin-db'
import { MIN_PASSWORD_LENGTH, USERNAME_RE, hashPassword, isSameOriginPost } from '@/lib/admin-auth'
import { issueSessionCookie, json, readJson, sessionSecret } from '@/lib/admin-guard'

/**
 * POST /api/admin/setup — creates the one admin account, first time only.
 * Once a user exists this always answers 409, so nobody can add a second.
 */
export async function POST(request: Request) {
  if (!isSameOriginPost(request)) return json(403, { ok: false, error: 'bad-origin' })
  if (!sessionSecret()) return json(503, { ok: false, error: 'not-configured' })

  const body = await readJson(request)
  const username = typeof body?.username === 'string' ? body.username.trim() : ''
  const password = typeof body?.password === 'string' ? body.password : ''
  if (!USERNAME_RE.test(username)) return json(422, { ok: false, error: 'bad-username' })
  if (password.length < MIN_PASSWORD_LENGTH || password.length > 200) return json(422, { ok: false, error: 'short-password' })

  try {
    if ((await adminDb.userCount()) > 0) return json(409, { ok: false, error: 'setup-done' })
    const changedAt = await adminDb.createUser(username, await hashPassword(password))
    return json(200, { ok: true, username }, { 'Set-Cookie': issueSessionCookie(request, username, changedAt) })
  } catch (err) {
    if (err instanceof DbError && err.detail.includes('setup already done')) {
      return json(409, { ok: false, error: 'setup-done' })
    }
    console.error('[admin/setup]', err)
    return json(503, { ok: false, error: 'store-failed' })
  }
}
