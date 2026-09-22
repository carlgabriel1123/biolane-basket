import { NextResponse } from 'next/server'

/**
 * Submission endpoint — MOCK.
 *
 * Right now this validates the shape and logs it. Replace the marked block
 * with a real integration. See the comment in lib/submission.ts.
 */
export async function POST(request: Request) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ ok: false, error: 'invalid-json' }, { status: 400 })
  }

  const data = body as Record<string, unknown>
  const required = ['submissionId', 'name', 'email', 'mobile', 'babyStage']
  const missing = required.filter((k) => !data?.[k])

  if (missing.length) {
    return NextResponse.json(
      { ok: false, error: 'missing-fields', missing },
      { status: 400 }
    )
  }

  // ─── CONNECT YOUR BACKEND HERE ──────────────────────────────────────
  // await fetch(process.env.SHEETS_WEBHOOK_URL!, {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify(data),
  // })
  // ────────────────────────────────────────────────────────────────────

  console.log('[biolane] submission received:', JSON.stringify(data))

  return NextResponse.json({ ok: true, submissionId: data.submissionId })
}
