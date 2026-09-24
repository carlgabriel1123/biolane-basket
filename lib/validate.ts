/** Validation helpers. All date maths is Asia/Manila, never the device clock. */

/** Today in Asia/Manila as a plain 'YYYY-MM-DD' string. */
export function manilaToday(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Manila',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())
}

/** Add days to a 'YYYY-MM-DD' string without touching timezones. */
export function addDays(isoDate: string, days: number): string {
  const [y, m, d] = isoDate.split('-').map(Number)
  const t = Date.UTC(y, m - 1, d) + days * 86_400_000
  const dt = new Date(t)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${dt.getUTCFullYear()}-${pad(dt.getUTCMonth() + 1)}-${pad(dt.getUTCDate())}`
}

/**
 * Normalise a Philippine mobile number to E.164 (+639XXXXXXXXX).
 * Accepts 09XXXXXXXXX, 639XXXXXXXXX, +639XXXXXXXXX, 9XXXXXXXXX,
 * with any spacing, dashes or brackets. Returns null if not a PH mobile.
 */
export function normalisePhMobile(raw: string): string | null {
  let digits = raw.replace(/[^\d]/g, '')

  // Strip an international dialling prefix first (00 63… or +63…), so the
  // remaining cases only have to reason about the national forms.
  if (digits.startsWith('00')) digits = digits.slice(2)

  let local: string | null = null
  if (digits.length === 11 && digits.startsWith('09')) local = digits.slice(1)
  else if (digits.length === 12 && digits.startsWith('639')) local = digits.slice(2)
  else if (digits.length === 10 && digits.startsWith('9')) local = digits

  if (!local || !local.startsWith('9') || local.length !== 10) return null
  return '+63' + local
}

/** Permissive email check — a strict RFC regex rejects real addresses. */
export function isPlausibleEmail(value: string): boolean {
  const v = value.trim()
  if (/\s/.test(v)) return false
  const parts = v.split('@')
  if (parts.length !== 2) return false
  const [local, domain] = parts
  return local.length > 0 && domain.includes('.') && !domain.startsWith('.') && !domain.endsWith('.')
}

/**
 * A TikTok or Instagram username as typed or pasted: "@hallie", "hallie",
 * or a profile link. Returns the bare lower-case username (no @), or null if
 * it cannot be one. Both apps allow only letters, numbers, . and _.
 */
export function normaliseHandle(raw: string): string | null {
  let v = raw.trim()
  const link = /^(?:https?:\/\/)?(?:www\.|m\.)?(?:tiktok\.com|instagram\.com)\/@?([^/?#\s]+)/i.exec(v)
  if (link) v = link[1]
  v = v.replace(/^@+/, '')
  return /^[A-Za-z0-9._]{1,30}$/.test(v) ? v.toLowerCase() : null
}

/** Letters (any language, incl. ñ and accents), spaces, apostrophes, hyphens. */
const BAG_NAME_ALLOWED = /^[\p{L}\p{M}\s'\-]*$/u

/** True if the bag vendor can print this name. Empty counts as printable. */
export function isPrintableBagName(value: string): boolean {
  return BAG_NAME_ALLOWED.test(value)
}

/** Collapse whitespace and trim — used before storing any typed name. */
export function tidy(value: string): string {
  return value.trim().replace(/\s+/g, ' ')
}
