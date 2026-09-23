import { headers } from 'next/headers'
import { adminDb, adminDbConfigured } from '@/lib/admin-db'
import { getAdminSessionFromCookie, sessionSecret } from '@/lib/admin-guard'
import { sheetConfigured } from '@/lib/sheets'
import { AlertIcon } from '@/components/icons'
import AdminShell from '@/components/admin/AdminShell'
import Dashboard from '@/components/admin/Dashboard'
import LoginForm from '@/components/admin/LoginForm'
import SetupForm from '@/components/admin/SetupForm'

export const dynamic = 'force-dynamic'

/** Soft peach notice card for the two "cannot show the dashboard" states. */
function Notice({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 rounded-card border border-blush bg-blush-soft p-4 text-[14px] text-ink shadow-soft">
      <AlertIcon size={20} className="mt-0.5 shrink-0 text-blush-deep" />
      <p>{children}</p>
    </div>
  )
}

/**
 * /admin — booth staff's view of every sign-up.
 * First visit ever: create the admin account. Then: log in. Then: dashboard.
 */
export default async function AdminPage() {
  if (!adminDbConfigured() || !sessionSecret()) {
    console.error(
      '[admin] not configured — missing:',
      ['SUPABASE_URL', 'SUPABASE_PUBLISHABLE_KEY', 'ADMIN_TOKEN', 'SESSION_SECRET'].filter((k) => !process.env[k]).join(', ')
    )
    return (
      <AdminShell>
        <Notice>The dashboard is not available yet.</Notice>
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
        <Notice>Could not reach the database. Try again in a moment.</Notice>
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
