import 'server-only'
import { NextResponse } from 'next/server'
import { adminDb } from './admin-db'
import {
  SESSION_COOKIE,
  SESSION_TTL_MS,
  cookieValue,
  createSessionToken,
  isSameOriginPost,
  readSessionToken,
  sessionCookieHeader,
  type Session,
} from './admin-auth'

/** Cookie check + "is this still the current password?" for admin routes. */

const PV_CACHE_MS = 60_000
const pvCache = new Map<string, { pv: number; at: number }>()

export function sessionSecret(): string | null {
  return process.env.SESSION_SECRET || null
}

export function isSecureRequest(request: Request): boolean {
  const proto = request.headers.get('x-forwarded-proto')
  if (proto) return proto === 'https'
  return new URL(request.url).protocol === 'https:'
}

export function clientIp(request: Request): string {
  return request.headers.get('x-real-ip') ?? request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
}

/** password_changed_at as ms, cached briefly so every request isn't a DB round trip. */
async function currentPasswordVersion(username: string): Promise<number | null> {
  const hit = pvCache.get(username)
  if (hit && Date.now() - hit.at < PV_CACHE_MS) return hit.pv
  const user = await adminDb.getUser(username)
  if (!user) return null
  const pv = new Date(user.password_changed_at).getTime()
  pvCache.set(username, { pv, at: Date.now() })
  return pv
}

export function forgetPasswordVersion(username: string): void {
  pvCache.delete(username)
}

/** The session in this Cookie header, or null if not logged in (or logged out by a password change). */
export async function getAdminSessionFromCookie(cookieHeader: string | null): Promise<Session | null> {
  const secret = sessionSecret()
  if (!secret) return null
  const session = readSessionToken(cookieValue(SESSION_COOKIE, cookieHeader), secret)
  if (!session) return null
  let pv = await currentPasswordVersion(session.u)
  if (pv !== null && pv !== session.pv) {
    // The cache may be stale (password just changed on another instance):
    // ask the database once more before rejecting.
    forgetPasswordVersion(session.u)
    pv = await currentPasswordVersion(session.u)
  }
  if (pv === null || pv !== session.pv) return null
  return session
}

export function getAdminSession(request: Request): Promise<Session | null> {
  return getAdminSessionFromCookie(request.headers.get('cookie'))
}

export function issueSessionCookie(request: Request, username: string, passwordChangedAt: string): string {
  const secret = sessionSecret()
  if (!secret) throw new Error('SESSION_SECRET missing')
  const token = createSessionToken(
    { u: username, exp: Date.now() + SESSION_TTL_MS, pv: new Date(passwordChangedAt).getTime() },
    secret
  )
  return sessionCookieHeader(token, isSecureRequest(request))
}

export function clearSessionCookie(request: Request): string {
  return sessionCookieHeader(null, isSecureRequest(request))
}

export const json = (status: number, body: Record<string, unknown>, headers?: Record<string, string>) =>
  NextResponse.json(body, { status, headers: { 'Cache-Control': 'no-store', ...headers } })

/**
 * For admin POST routes: returns an error response to send, or null when
 * the request is a same-origin call from a logged-in admin.
 */
export async function guardAdminPost(request: Request): Promise<{ session: Session } | { error: NextResponse }> {
  if (!isSameOriginPost(request)) return { error: json(403, { ok: false, error: 'bad-origin' }) }
  const session = await getAdminSession(request)
  if (!session) return { error: json(401, { ok: false, error: 'not-logged-in' }) }
  return { session }
}

export async function guardAdminGet(request: Request): Promise<{ session: Session } | { error: NextResponse }> {
  const session = await getAdminSession(request)
  if (!session) return { error: json(401, { ok: false, error: 'not-logged-in' }) }
  return { session }
}

/** Reads a small JSON body; null if missing or malformed. */
export async function readJson(request: Request, maxBytes = 4096): Promise<Record<string, unknown> | null> {
  const buf = await request.arrayBuffer()
  if (buf.byteLength > maxBytes) return null
  try {
    const v = JSON.parse(new TextDecoder().decode(buf))
    return v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : null
  } catch {
    return null
  }
}
