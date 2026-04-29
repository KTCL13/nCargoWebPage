'use client'

import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { NAV_ITEMS } from '@/components/layout/nav-config'
import { useAuth } from '@/context/AuthContext'

export default function EmployeeDashboardPage() {
  const { user } = useAuth()

  return (
    <DashboardLayout
      pageTitle="Dashboard"
      navItems={NAV_ITEMS}
      onReload={() => window.location.reload()}
    >
      <h2 className="font-titles text-2xl font-extrabold text-[var(--color-nc-dark)]">
        Dashboard
      </h2>

      <div className="flex items-center justify-center flex-1 py-20">
        <div className="text-center">
          <div className="text-5xl mb-4">👋</div>
          <p className="font-titles text-xl font-bold text-[var(--color-nc-dark)]">
            Bienvenido{user?.name ? `, ${user.name}` : ''}
          </p>
          <p className="font-subtitles text-sm text-[var(--color-nc-dark)]/50 mt-2">
            Usa el menú lateral para navegar entre tus secciones.
          </p>
        </div>
      </div>
    </DashboardLayout>
  )
}
