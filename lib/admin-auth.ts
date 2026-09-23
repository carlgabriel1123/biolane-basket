import 'server-only'
import { createHmac, randomBytes, scrypt, timingSafeEqual } from 'node:crypto'
import { promisify } from 'node:util'

/**
 * Admin login for /admin — server only.
 *
 * Passwords: scrypt hashes, stored in the database (private.admin_users).
 * Sessions:  a signed cookie. The signature covers the username, the expiry
 *            and the moment the password was last changed, so changing the
 *            password logs every device out.
 */

const scryptAsync = promisify(scrypt) as (
  password: string | Buffer,
  salt: Buffer,
  keylen: number,
  options: { N: number; r: number; p: number }
) => Promise<Buffer>

const SCRYPT = { N: 16384, r: 8, p: 1 }
const KEY_LEN = 64

export const USERNAME_RE = /^[a-z0-9._-]{3,40}$/i
export const MIN_PASSWORD_LENGTH = 10

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16)
  const key = await scryptAsync(password.normalize('NFKC'), salt, KEY_LEN, SCRYPT)
  return ['scrypt', SCRYPT.N, SCRYPT.r, SCRYPT.p, salt.toString('base64url'), key.toString('base64url')].join('$')
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const parts = stored.split('$')
  if (parts.length !== 6 || parts[0] !== 'scrypt') return false
  const [, N, r, p, saltB64, keyB64] = parts
  const expected = Buffer.from(keyB64, 'base64url')
  try {
    const actual = await scryptAsync(password.normalize('NFKC'), Buffer.from(saltB64, 'base64url'), expected.length, {
      N: Number(N),
      r: Number(r),
      p: Number(p),
    })
    return actual.length === expected.length && timingSafeEqual(actual, expected)
  } catch {
    return false
  }
}

/* ---------------- sessions ---------------- */

export const SESSION_COOKIE = 'biolane_admin'
export const SESSION_TTL_MS = 12 * 60 * 60 * 1000

export interface Session {
  /** username */
  u: string
  /** expiry, ms since epoch */
  exp: number
  /** password_changed_at, ms since epoch — must still match the database */
  pv: number
}

function sign(body: string, secret: string): string {
  return createHmac('sha256', secret).update(body).digest('base64url')
}

export function createSessionToken(session: Session, secret: string): string {
  const body = Buffer.from(JSON.stringify(session)).toString('base64url')
  return `${body}.${sign(body, secret)}`
}

/** Returns the session if the token is well formed, unexpired and signed with `secret`. */
export function readSessionToken(token: string | undefined, secret: string, now = Date.now()): Session | null {
  if (!token) return null
  const dot = token.lastIndexOf('.')
  if (dot <= 0) return null
  const body = token.slice(0, dot)
  const sig = Buffer.from(token.slice(dot + 1), 'base64url')
  const expected = Buffer.from(sign(body, secret), 'base64url')
  if (sig.length !== expected.length || !timingSafeEqual(sig, expected)) return null
  try {
    const s = JSON.parse(Buffer.from(body, 'base64url').toString()) as Partial<Session>
    if (typeof s.u !== 'string' || typeof s.exp !== 'number' || typeof s.pv !== 'number') return null
    if (s.exp <= now) return null
    return { u: s.u, exp: s.exp, pv: s.pv }
  } catch {
    return null
  }
}

export function cookieValue(name: string, cookieHeader: string | null): string | undefined {
  if (!cookieHeader) return undefined
  for (const part of cookieHeader.split(';')) {
    const [k, ...v] = part.trim().split('=')
    if (k === name) return decodeURIComponent(v.join('='))
  }
  return undefined
}

export function sessionCookieHeader(token: string | null, secure: boolean): string {
  const base = `${SESSION_COOKIE}=${token ?? ''}; Path=/; HttpOnly; SameSite=Lax${secure ? '; Secure' : ''}`
  return token ? `${base}; Max-Age=${Math.floor(SESSION_TTL_MS / 1000)}` : `${base}; Max-Age=0`
}

/**
 * True when a browser POST comes from this site. Every admin POST must also
 * send `X-Requested-With: biolane-admin`, which a cross-site form cannot.
 */
export function isSameOriginPost(request: Request): boolean {
  const origin = request.headers.get('origin')
  const host = request.headers.get('x-forwarded-host') ?? request.headers.get('host')
  if (!origin || !host) return false
  let originHost: string
  try {
    originHost = new URL(origin).host
  } catch {
    return false
  }
  return originHost === host && request.headers.get('x-requested-with') === 'biolane-admin'
}
