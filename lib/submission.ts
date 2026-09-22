import type { BabyStage } from '@/data/campaign'

/** Exactly what gets stored for every mom who completes the checklist. */
export interface Submission {
  submissionId: string
  timestamp: string
  name: string
  email: string
  mobile: string
  babyStage: BabyStage
  dueDate?: string
  marketingConsent: boolean
  selectedProducts: Array<{
    id: string
    name: string
    size: string
    gbfSku: string
    price: number
  }>
  basketTotal: number
  rewardUnlocked: boolean
  personalizationName?: string
}

export type SubmitResult =
  | { ok: true; submissionId: string; storedRemotely: boolean }
  | { ok: false; error: string }

const STORAGE_KEY = 'biolane-nesting-submissions'

/**
 * ┌──────────────────────────────────────────────────────────────────┐
 * │ TO CONNECT A REAL BACKEND                                        │
 * │                                                                  │
 * │ This site is a static export on GitHub Pages, so there is no     │
 * │ server of its own. Point it at a webhook that accepts JSON:      │
 * │   • Google Sheets  — an Apps Script "web app" URL                │
 * │   • n8n / Make / Zapier — a webhook trigger                      │
 * │   • Airtable / Supabase — via one of the above, or an edge fn    │
 * │                                                                  │
 * │ Set it in .env.local (and as a repo secret for the deploy):      │
 * │   NEXT_PUBLIC_SUBMIT_WEBHOOK_URL=https://…                       │
 * │                                                                  │
 * │ Until then every lead is kept in localStorage on the phone, and  │
 * │ the confirmation screen shows "Will sync" instead of "Saved".    │
 * └──────────────────────────────────────────────────────────────────┘
 */
const WEBHOOK_URL = process.env.NEXT_PUBLIC_SUBMIT_WEBHOOK_URL ?? ''

function newId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return 'BIO-' + crypto.randomUUID().slice(0, 8).toUpperCase()
  }
  return 'BIO-' + Math.abs(Date.now() % 100000000).toString(36).toUpperCase()
}

/** Keep a local copy so a dropped connection at the booth never loses a lead. */
function stashLocally(submission: Submission): void {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    const all: Submission[] = raw ? JSON.parse(raw) : []
    all.push(submission)
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(all))
  } catch {
    // Private mode / blocked storage — the POST below is still attempted.
  }
}

export async function submitChecklist(
  data: Omit<Submission, 'submissionId' | 'timestamp'>
): Promise<SubmitResult> {
  const submission: Submission = {
    ...data,
    submissionId: newId(),
    timestamp: new Date().toISOString(),
  }

  stashLocally(submission)

  if (!WEBHOOK_URL) {
    // No backend configured yet — the local copy is the record.
    return { ok: true, submissionId: submission.submissionId, storedRemotely: false }
  }

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 8000)

    const res = await fetch(WEBHOOK_URL, {
      method: 'POST',
      // text/plain avoids a CORS preflight, which Apps Script web apps
      // cannot answer. The body is still JSON.
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(submission),
      signal: controller.signal,
    })
    clearTimeout(timeout)

    return {
      ok: true,
      submissionId: submission.submissionId,
      storedRemotely: res.ok,
    }
  } catch {
    // Offline / flaky booth wifi. The local copy means nothing is lost.
    return { ok: true, submissionId: submission.submissionId, storedRemotely: false }
  }
}

/** Dev helper: read back everything captured on this device. */
export function getStashedSubmissions(): Submission[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}
