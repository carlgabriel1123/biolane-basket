import { isSameOriginPost } from '@/lib/admin-auth'
import { clearSessionCookie, json } from '@/lib/admin-guard'

/** POST /api/admin/logout — clears the session cookie. Same-origin only, so no other site can log staff out. */
export async function POST(request: Request) {
  if (!isSameOriginPost(request)) return json(403, { ok: false, error: 'bad-origin' })
  return json(200, { ok: true }, { 'Set-Cookie': clearSessionCookie(request) })
}
