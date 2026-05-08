'use client'

import { useState } from 'react'
import { Sidebar, NavItem } from './Sidebar'
import { Topbar } from './Topbar'
import { BottomNav } from './BottomNav'
import { useAuth } from '@/context/AuthContext'

interface DashboardLayoutProps {
  children: React.ReactNode
  pageTitle: string
  navItems: NavItem[]
  onReload?: () => void
}

export function DashboardLayout({
  children,
  pageTitle,
  navItems,
  onReload,
}: DashboardLayoutProps) {

  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { user, logout } = useAuth()

  return (
    <div className="flex min-h-screen bg-[var(--color-nc-white)] font-body pb-[65px] md:pb-0">

      <Sidebar
        items={navItems}
        userRole={user?.role || ''}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="md:ml-[240px] flex flex-col flex-1 min-h-screen w-full relative">

        <Topbar
          pageTitle={pageTitle}
          userName={user?.name || ''}
          userRole={user?.role || ''}
          onLogout={logout}
          onReload={onReload}
          onMenuToggle={() => setSidebarOpen(o => !o)}
        />

        <main className="flex-1 p-4 sm:p-5 lg:p-8 flex flex-col gap-6">
          {children}
        </main>

        <BottomNav items={navItems} userRole={user?.role || ''} />
      </div>
    </div>
  )
}