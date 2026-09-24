import { adminDb } from '@/lib/admin-db'
import { guardAdminGet, json } from '@/lib/admin-guard'
import { dayInRange, isIsoDay, manilaDay, orderedRange } from '@/lib/dates'
import { toCsv, toSheetRow } from '@/lib/sheet-row'

/**
 * GET /api/admin/export[?from=YYYY-MM-DD&to=YYYY-MM-DD] — sign-ups as a CSV
 * download. With from / to (either or both), only sign-ups whose Manila
 * sign-up date is in that range, both days included — the same rule as the
 * dashboard's Date filter.
 */
export async function GET(request: Request) {
  const guard = await guardAdminGet(request)
  if ('error' in guard) return guard.error

  const params = new URL(request.url).searchParams
  const fromRaw = params.get('from') ?? ''
  const toRaw = params.get('to') ?? ''
  if ((fromRaw && !isIsoDay(fromRaw)) || (toRaw && !isIsoDay(toRaw))) {
    return json(400, { ok: false, error: 'bad-date' })
  }
  const range = orderedRange(fromRaw, toRaw)
  const filtered = Boolean(range.from || range.to)

  try {
    const all = await adminDb.listSubmissions(null)
    const rows = filtered ? all.filter((s) => dayInRange(manilaDay(s.received_at), range)) : all
    const name = filtered
      ? range.from === range.to
        ? range.from
        : `${range.from || 'start'}-to-${range.to || 'now'}`
      : manilaDay(new Date())
    return new Response(toCsv(rows.map(toSheetRow)), {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="biolane-signups-${name}.csv"`,
        'Cache-Control': 'no-store',
      },
    })
  } catch (err) {
    console.error('[admin/export]', err)
    return json(503, { ok: false, error: 'store-failed' })
  }
}
