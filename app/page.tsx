import ChecklistApp from '@/components/ChecklistApp'
import { getCatalog } from '@/lib/shopify'

/**
 * The page is rendered on the server with biolane.ph's current prices,
 * sale prices, stock and photos, and re-rendered at most every 30 minutes
 * (the same number as CATALOG_REVALIDATE_SECONDS in lib/shopify.ts; Next
 * needs a literal here). Everything interactive lives in ChecklistApp.
 */
export const revalidate = 1800

export default async function Page() {
  const catalog = await getCatalog()
  return <ChecklistApp catalog={catalog} />
}
