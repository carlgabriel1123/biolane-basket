/**
 * All Biolane fair prices are whole pesos, so the basket is integer maths.
 * No floating point is ever introduced — this avoids 2298.9999 style bugs.
 */
export function peso(amount: number): string {
  return '₱' + Math.round(amount).toLocaleString('en-PH')
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
