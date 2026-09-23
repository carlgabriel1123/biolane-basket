'use client'

/** Small fetch helpers for the admin screens. Every POST carries the header the server requires. */

export interface ApiError {
  status: number
  error: string
  lockedUntil?: string | null
}

export async function adminPost<T = Record<string, unknown>>(path: string, body: unknown): Promise<T> {
  const res = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'biolane-admin' },
    body: JSON.stringify(body ?? {}),
    credentials: 'same-origin',
  })
  const data = (await res.json().catch(() => ({}))) as Record<string, unknown>
  if (!res.ok || data.ok === false) {
    throw { status: res.status, error: String(data.error ?? `http-${res.status}`), lockedUntil: data.lockedUntil as string | null } satisfies ApiError
  }
  return data as T
}

export async function adminGet<T = Record<string, unknown>>(path: string): Promise<T> {
  const res = await fetch(path, { credentials: 'same-origin', cache: 'no-store' })
  const data = (await res.json().catch(() => ({}))) as Record<string, unknown>
  if (!res.ok || data.ok === false) {
    throw { status: res.status, error: String(data.error ?? `http-${res.status}`) } satisfies ApiError
  }
  return data as T
}

export function describeError(err: unknown): string {
  const e = err as Partial<ApiError> | undefined
  switch (e?.error) {
    case 'bad-login':
      return 'Wrong username or password.'
    case 'locked':
      return `Too many tries. Locked until ${e.lockedUntil ? new Date(e.lockedUntil).toLocaleTimeString('en-PH', { timeZone: 'Asia/Manila', hour: 'numeric', minute: '2-digit' }) : 'later'}.`
    case 'not-logged-in':
      return 'Your session ended. Please log in again.'
    case 'bad-origin':
      return 'This request was blocked. Reload the page and try again.'
    case 'setup-done':
      return 'The admin account already exists. Please log in.'
    case 'bad-username':
      return 'Username: 3 to 40 letters, numbers, dots, dashes or underscores.'
    case 'short-password':
      return 'Password must be at least 10 characters.'
    case 'wrong-current':
      return 'The current password is wrong.'
    case 'not-configured':
      return 'Not set up on the server yet.'
    case 'store-failed':
      return 'The database did not answer. Try again.'
    default:
      return 'Something went wrong. Try again.'
  }
}
