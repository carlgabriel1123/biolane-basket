/**
 * All Biolane fair prices are whole pesos, so the basket is integer maths.
 * No floating point is ever introduced — this avoids 2298.9999 style bugs.
 */
export function peso(amount: number): string {
  return '₱' + Math.round(amount).toLocaleString('en-PH')
}
