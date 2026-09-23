import { headers } from 'next/headers'
import { adminDb, adminDbConfigured } from '@/lib/admin-db'
import { getAdminSessionFromCookie, sessionSecret } from '@/lib/admin-guard'
import { sheetConfigured } from '@/lib/sheets'
import AdminShell from '@/components/admin/AdminShell'
import Dashboard from '@/components/admin/Dashboard'
import LoginForm from '@/components/admin/LoginForm'
import SetupForm from '@/components/admin/SetupForm'

export const dynamic = 'force-dynamic'

/**
 * /admin — booth staff's view of every sign-up.
 * First visit ever: create the admin account. Then: log in. Then: dashboard.
 */
export default async function AdminPage() {
  if (!adminDbConfigured() || !sessionSecret()) {
    return (
      <AdminShell>
        <p className="rounded-card border border-blush bg-blush-soft p-4 text-[14px] text-ink">
          The dashboard is not set up on this server yet: ADMIN_TOKEN, SESSION_SECRET, SUPABASE_URL and
          SUPABASE_PUBLISHABLE_KEY must all be set.
        </p>
      </AdminShell>
    )
  }

  let userCount: number
  try {
    userCount = await adminDb.userCount()
  } catch (err) {
    console.error('[admin] userCount', err)
    return (
      <AdminShell>
        <p className="rounded-card border border-blush bg-blush-soft p-4 text-[14px] text-ink">
          Could not reach the database. Try again in a moment.
        </p>
      </AdminShell>
    )
  }

  if (userCount === 0) {
    return (
      <AdminShell>
        <SetupForm />
      </AdminShell>
    )
  }

  const session = await getAdminSessionFromCookie((await headers()).get('cookie'))
  if (!session) {
    return (
      <AdminShell>
        <LoginForm />
      </AdminShell>
    )
  }

  return <Dashboard username={session.u} sheetConfigured={sheetConfigured()} />
}
