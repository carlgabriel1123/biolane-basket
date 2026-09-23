import type { BabyStage } from '../data/campaign.ts'

/** The sign-up details from the first screen. */
export interface LeadInfo {
  name: string
  email: string
  /** Normalised to +639XXXXXXXXX. */
  mobile: string
  babyStage: BabyStage
  dueDate?: string
  marketingConsent: boolean
}

/**
 * One record per mom. It is sent twice with the SAME submissionId:
 *   event 'signup'              — when she joins (screen 1), empty basket
 *   event 'checklist_completed' — when she finishes, with her basket
 * The receiving sheet/CRM should upsert on submissionId.
 */
export interface Submission extends LeadInfo {
  submissionId: string
  timestamp: string
  event: 'signup' | 'checklist_completed'
  selectedProducts: Array<{
    id: string
    name: string
    size: string
    gbfSku: string
    price: number
    qty: number
    lineTotal: number
  }>
  basketTotal: number
  rewardUnlocked: boolean
  personalizationName?: string
}

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
 * │ For the live site: add a repository secret named                 │
 * │   NEXT_PUBLIC_SUBMIT_WEBHOOK_URL                                 │
 * │ (Settings → Secrets and variables → Actions). deploy.yml already │
 * │ passes it to the build. For local runs put the same line in      │
 * │ .env.local.                                                      │
 * │                                                                  │
 * │ Until then every record is kept in localStorage on the phone.    │
 * └──────────────────────────────────────────────────────────────────┘
 */
const WEBHOOK_URL = process.env.NEXT_PUBLIC_SUBMIT_WEBHOOK_URL ?? ''

export function newSubmissionId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return 'BIO-' + crypto.randomUUID().slice(0, 8).toUpperCase()
  }
  return 'BIO-' + Math.abs(Date.now() % 100000000).toString(36).toUpperCase()
}

/** Offline safety net. Replaces any earlier record with the same id. */
function stashLocally(submission: Submission): void {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    const all: Submission[] = raw ? JSON.parse(raw) : []
    const rest = all.filter((s) => s.submissionId !== submission.submissionId)
    rest.push(submission)
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(rest))
  } catch {
    // Private mode / blocked storage — the POST below is still attempted.
  }
}

/** Saves locally, then POSTs. Resolves true only if the webhook accepted it. */
export async function sendSubmission(submission: Submission): Promise<boolean> {
  stashLocally(submission)
  if (!WEBHOOK_URL) return false

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
    return res.ok
  } catch {
    // Offline / flaky booth wifi. The local copy means nothing is lost.
    return false
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
