/**
 * Calendar days for the admin date filter. A "day" is a 'YYYY-MM-DD' string
 * in Asia/Manila, so a sign-up at 12:30 AM Manila counts on that Manila date
 * whatever timezone the admin's phone or the server is in. No server-only
 * imports: the dashboard, the CSV export and the tests share these.
 */

const manilaDayFmt = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Manila',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

/** The Manila calendar day of an instant, as 'YYYY-MM-DD'. '' if the time is unreadable. */
export function manilaDay(iso: string | Date): string {
  const d = typeof iso === 'string' ? new Date(iso) : iso
  return Number.isNaN(d.getTime()) ? '' : manilaDayFmt.format(d)
}

/** A real calendar date written 'YYYY-MM-DD' (rejects 2026-02-30). */
export function isIsoDay(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const t = Date.parse(`${value}T00:00:00Z`)
  return !Number.isNaN(t) && new Date(t).toISOString().slice(0, 10) === value
}

export interface DayRange {
  /** First day included, or '' for no lower limit. */
  from: string
  /** Last day included, or '' for no upper limit. */
  to: string
}

/** Puts the ends in order, so picking the later day first still works. */
export function orderedRange(from: string, to: string): DayRange {
  return from && to && from > to ? { from: to, to: from } : { from, to }
}

/** True if `day` falls inside the range, both ends included. */
export function dayInRange(day: string, { from, to }: DayRange): boolean {
  return Boolean(day) && (!from || day >= from) && (!to || day <= to)
}

const labelFmt = new Intl.DateTimeFormat('en-PH', { timeZone: 'UTC', weekday: 'short', month: 'short', day: 'numeric' })
const labelYearFmt = new Intl.DateTimeFormat('en-PH', {
  timeZone: 'UTC',
  weekday: 'short',
  month: 'short',
  day: 'numeric',
  year: 'numeric',
})

/** 'Thu, Oct 8', with the year added when it isn't `thisYear`. */
export function dayLabel(day: string, thisYear?: string): string {
  const d = new Date(`${day}T00:00:00Z`)
  if (Number.isNaN(d.getTime())) return day
  return (thisYear && day.slice(0, 4) !== thisYear ? labelYearFmt : labelFmt).format(d)
}

/** 'Thu, Oct 8', 'Thu, Oct 8 – Fri, Oct 9', 'from Thu, Oct 8', 'until Fri, Oct 9', or ''. */
export function rangeLabel({ from, to }: DayRange, thisYear?: string): string {
  if (from && to) return from === to ? dayLabel(from, thisYear) : `${dayLabel(from, thisYear)} – ${dayLabel(to, thisYear)}`
  if (from) return `from ${dayLabel(from, thisYear)}`
  if (to) return `until ${dayLabel(to, thisYear)}`
  return ''
}
