/**
 * Small helpers shared by every scripted scroll on the site, so they all
 * respect "Reduce motion" and the fixed basket bar the same way.
 */

/** 'smooth', or an instant jump for anyone whose device asks for less motion. */
export function scrollBehavior(): ScrollBehavior {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ? 'auto'
    : 'smooth'
}

/** Where the fixed things at the bottom (basket bar, suggestions pill) begin. */
function coveredFrom(): number {
  let top = window.innerHeight
  for (const id of ['basket-bar', 'recs-nudge-pill']) {
    const el = document.getElementById(id)
    if (el) top = Math.min(top, el.getBoundingClientRect().top)
  }
  return top
}

/** True when the element is fully on screen and not hidden behind the basket bar or pill. */
export function isClearOnScreen(el: Element): boolean {
  const r = el.getBoundingClientRect()
  return r.top >= 0 && r.bottom <= coveredFrom() - 4
}

/**
 * Focus moved to a control without scrolling: if it ended up off screen or
 * under the basket bar, bring it into view (the html scroll-padding keeps it
 * clear of the bar).
 */
export function revealIfHidden(el: HTMLElement | null | undefined): void {
  if (el && !isClearOnScreen(el)) el.scrollIntoView({ block: 'nearest', behavior: scrollBehavior() })
}
