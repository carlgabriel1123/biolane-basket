import { NextResponse } from 'next/server'

/**
 * GET /api/health — called once a day by a Vercel cron (vercel.json).
 *
 * It makes one tiny database call (public.ping) so the free Supabase
 * project never pauses for inactivity before or during the fair. A paused
 * project would make every sign-up fail until someone restores it by hand.
 * Also handy as a quick "is saving working?" check from a phone.
 */
export const dynamic = 'force-dynamic'

export async function GET() {
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
    return NextResponse.json(
      { ok, database: ok ? 'reachable' : `error ${res.status}` },
      { status: ok ? 200 : 503, headers: { 'Cache-Control': 'no-store' } }
    )
  } catch {
    return NextResponse.json({ ok: false, database: 'unreachable' }, { status: 503 })
  }
}
