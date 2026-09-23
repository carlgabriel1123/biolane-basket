import { adminDb } from '@/lib/admin-db'
import { guardAdminGet, json } from '@/lib/admin-guard'
import { toCsv, toSheetRow } from '@/lib/sheet-row'

/** GET /api/admin/export — every sign-up as a CSV download. */
export async function GET(request: Request) {
  const guard = await guardAdminGet(request)
  if ('error' in guard) return guard.error
  try {
    const rows = await adminDb.listSubmissions(null)
    const stamp = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Manila' }).format(new Date())
    return new Response(toCsv(rows.map(toSheetRow)), {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="biolane-signups-${stamp}.csv"`,
        'Cache-Control': 'no-store',
      },
    })
  } catch (err) {
    console.error('[admin/export]', err)
    return json(503, { ok: false, error: 'store-failed' })
  }
}
