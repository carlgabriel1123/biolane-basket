/**
 * Money is shown to the centavo only when there are centavos: ₱1,850 and
 * ₱1,850.20. Amounts are rounded to the centavo first, so a floating-point
 * 2622.9999 never leaks onto the screen.
 */
export function peso(amount: number): string {
  const cents = Math.round(amount * 100)
  const sign = cents < 0 ? '-' : ''
  const whole = Math.floor(Math.abs(cents) / 100)
  const frac = Math.abs(cents) % 100
  return `${sign}₱${whole.toLocaleString('en-PH')}${frac ? '.' + String(frac).padStart(2, '0') : ''}`
}

/**
 * For greetings only: "maria clara" → "Maria Clara". Each word gets a capital
 * first letter; the rest is left as typed. What she typed is what is saved.
 */
export function greetingName(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .map((w) => (w ? w.charAt(0).toLocaleUpperCase('en-PH') + w.slice(1) : w))
    .join(' ')
}
