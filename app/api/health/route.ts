import { NextResponse } from 'next/server'
import { retryUnsynced, sheetConfigured } from '@/lib/sheets'

/**
 * GET /api/health — called once a day by a Vercel cron (vercel.json).
 *
 * It makes one tiny database call (public.ping) so the free Supabase
 * project never pauses for inactivity before or during the fair. A paused
 * project would make every sign-up fail until someone restores it by hand.
 * Also handy as a quick "is saving working?" check from a phone.
 */
export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_PUBLISHABLE_KEY
  if (!url || !key) {
    return NextResponse.json({ ok: false, database: 'not-configured' }, { status: 503 })
  }
  try {
    const res = await fetch(`${url}/rest/v1/rpc/ping`, {
      method: 'POST',
      headers: { apikey: key, 'Content-Type': 'application/json' },
      body: '{}',
      cache: 'no-store',
      signal: AbortSignal.timeout(8000),
    })
    const ok = res.ok
    // The daily cron (it sends CRON_SECRET) also re-sends any rows the
    // Google Sheet has not confirmed. A public GET never triggers that.
    let sheet: string | null = null
    const cron = process.env.CRON_SECRET
    if (ok && cron && request.headers.get('authorization') === `Bearer ${cron}` && sheetConfigured()) {
      const r = await retryUnsynced(50).catch((err) => ({ attempted: 0, synced: 0, error: String(err) }))
      sheet = r.error ?? `synced ${r.synced} of ${r.attempted}`
    }
    return NextResponse.json(
      { ok, database: ok ? 'reachable' : `error ${res.status}`, ...(sheet ? { sheet } : {}) },
      { status: ok ? 200 : 503, headers: { 'Cache-Control': 'no-store' } }
    )
  } catch {
    return NextResponse.json({ ok: false, database: 'unreachable' }, { status: 503 })
  }
}
