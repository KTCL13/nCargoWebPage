'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ReactNode } from 'react'
import Image from 'next/image'

export interface NavItem {
  label: string
  href: string
  icon: ReactNode
  roles?: string[]
  section?: string
}

interface SidebarProps {
  items: NavItem[]
  userRole: string
  systemName?: string
  systemSub?: string
  isOpen: boolean
  onClose: () => void
}

export function Sidebar({
  items,
  userRole,
  systemName = 'N-Cargo',
  systemSub = 'Admin Panel',
  isOpen,
  onClose,
}: SidebarProps) {
  const pathname = usePathname()

  const visible = items.filter(
    item => !item.roles || item.roles.includes(userRole)
  )

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={`
          w-[240px] min-h-screen bg-[var(--color-foreground)]/98 backdrop-blur-md border-r border-white/10 shadow-lg shadow-black/30 flex flex-col
          fixed top-0 left-0 z-50
          transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          md:translate-x-0
        `}
      >
        {/* Logo */}
        <div className="h-[80px] px-5 border-b border-white/10 flex items-center shrink-0">
          <Link href="/" aria-label="N-Cargo" className="rounded-[var(--radius-md)] focus-visible:ring-3 focus-visible:ring-[var(--color-primary)] outline-none block w-full">
            <Image src="/images/logos/77.PNG" alt="N-Cargo Admin" className="object-contain rounded-[var(--radius-md)]" width={97} height={29} sizes="97px" priority />
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-2 overflow-y-auto">
          {visible.map((item, idx) => {
            const isActive =
              pathname === item.href ||
              (item.href !== '/' && pathname.startsWith(item.href))

            const prevSection = idx > 0 ? visible[idx - 1].section : undefined
            const showSectionHeader = item.section && item.section !== prevSection

            return (
              <div key={item.href}>
                {showSectionHeader && (
                  <div className="px-4 pt-4 pb-1">
                    <span className="font-subtitles text-[10px] uppercase tracking-widest text-white/40 font-semibold">
                      {item.section}
                    </span>
                  </div>
                )}
                <Link
                  href={item.href}
                  onClick={onClose}
                  aria-current={isActive ? 'page' : undefined}
                  className={`
                    flex items-center gap-3 px-4 py-2 mx-2 my-1 rounded-md
                    text-sm font-subtitles transition-all duration-200
                    focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--color-nc-red)]
                    ${isActive
                      ? 'bg-white/10 text-white font-semibold border-l-4 border-[var(--color-nc-red)]'
                      : 'text-white/75 hover:text-white hover:bg-white/10'
                    }
                  `}
                >
                  <span className={`
                    w-8 h-8 flex items-center justify-center rounded-md text-sm flex-shrink-0
                    ${isActive ? 'bg-[var(--color-nc-blue)] text-white' : 'bg-white/10 text-white'}
                  `}>
                    {item.icon}
                  </span>
                  <span className="flex-1">{item.label}</span>
                </Link>
              </div>
            )
          })}
        </nav>
      </aside>
    </>
  )
}
