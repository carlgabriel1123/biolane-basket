import { clearSessionCookie, json } from '@/lib/admin-guard'

/** POST /api/admin/logout — clears the session cookie. */
export async function POST(request: Request) {
  return json(200, { ok: true }, { 'Set-Cookie': clearSessionCookie(request) })
}
