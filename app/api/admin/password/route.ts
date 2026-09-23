import { adminDb } from '@/lib/admin-db'
import { MIN_PASSWORD_LENGTH, hashPassword, verifyPassword } from '@/lib/admin-auth'
import { forgetPasswordVersion, guardAdminPost, issueSessionCookie, json, readJson } from '@/lib/admin-guard'

/** POST /api/admin/password — {current, next}. Logs every other device out. */
export async function POST(request: Request) {
  const guard = await guardAdminPost(request)
  if ('error' in guard) return guard.error

  const body = await readJson(request)
  const current = typeof body?.current === 'string' ? body.current : ''
  const next = typeof body?.next === 'string' ? body.next : ''
  if (next.length < MIN_PASSWORD_LENGTH || next.length > 200) return json(422, { ok: false, error: 'short-password' })

  try {
    const user = await adminDb.getUser(guard.session.u)
    if (!user || !(await verifyPassword(current, user.password_hash))) {
      return json(401, { ok: false, error: 'wrong-current' })
    }
    const changedAt = await adminDb.setPassword(user.username, await hashPassword(next))
    forgetPasswordVersion(user.username)
    return json(200, { ok: true }, { 'Set-Cookie': issueSessionCookie(request, user.username, changedAt) })
  } catch (err) {
    console.error('[admin/password]', err)
    return json(503, { ok: false, error: 'store-failed' })
  }
}
