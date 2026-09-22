/**
 * Analytics event hooks.
 *
 * The site works with NO analytics connected — these are no-ops until a
 * provider is wired up. To connect Meta Pixel / GA4 later, implement the
 * bodies below; nothing else in the app needs to change.
 */

export type AnalyticsEvent =
  | 'nesting_started'
  | 'product_selected'
  | 'product_removed'
  | 'reward_progress'
  | 'reward_unlocked'
  | 'community_signup_started'
  | 'community_signup_completed'
  | 'form_submitted'

type Payload = Record<string, string | number | boolean | undefined>

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void
    gtag?: (...args: unknown[]) => void
  }
}

export function track(event: AnalyticsEvent, payload: Payload = {}): void {
  if (typeof window === 'undefined') return

  // --- Meta Pixel ---  window.fbq?.('trackCustom', event, payload)
  // --- GA4 ---         window.gtag?.('event', event, payload)

  if (process.env.NODE_ENV === 'development') {
    // eslint-disable-next-line no-console
    console.debug('[analytics]', event, payload)
  }
}

/** Fire `reward_progress` at most once per 25% band, so we don't spam. */
export function makeProgressTracker() {
  let lastBand = -1
  return (total: number, threshold: number) => {
    const band = Math.min(4, Math.floor((total / threshold) * 4))
    if (band !== lastBand) {
      lastBand = band
      track('reward_progress', { total, threshold, band })
    }
  }
}
