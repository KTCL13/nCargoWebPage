//src/components/layout/Topbar.tsx
'use client'

import { NotificationBell } from '@/components/ui/NotificationBell'

interface TopbarProps {
  pageTitle: string
  userName: string
  userRole: string
  onLogout: () => void
  onReload?: () => void
  onMenuToggle?: () => void
}

export function Topbar({
  pageTitle,
  userName,
  userRole,
  onLogout,
  onReload,
  onMenuToggle,
}: TopbarProps) {

  const initials = userName
    ? userName
      .split(' ')
      .map(n => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase()
    : '??'

  return (
    <header
      className="h-[80px] bg-[var(--color-foreground)]/98 backdrop-blur-md border-b border-white/10 shadow-lg shadow-black/30 flex items-center justify-between px-5 lg:px-[6%] sticky top-0 z-40 transition-all duration-300"
    >
      <div className="flex items-center gap-4">
        {/* Hamburger — mobile only */}
        {onMenuToggle && (
          <button
            onClick={onMenuToggle}
            aria-label="Abrir menú"
            className="md:hidden w-10 h-10 flex items-center justify-center rounded-[var(--radius-md)] text-white hover:bg-white/10 focus-visible:ring-3 focus-visible:ring-[var(--color-secondary)] outline-none transition-colors"
          >
            <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        )}

        {/* Title */}
        <h1 className="font-titles text-[20px] md:text-[24px] text-white truncate">
          {pageTitle}
        </h1>
      </div>

      {/* Right section */}
      <div className="flex items-center gap-2 sm:gap-3 md:gap-4 min-w-0">

        {/* Reload — hidden on very small screens to save space */}
        {onReload && (
          <button
            onClick={onReload}
            aria-label="Recargar página"
            className="hidden xs:flex w-10 h-10 items-center justify-center rounded-[var(--radius-md)] border border-transparent text-white/80 hover:bg-white/10 hover:text-white transition-colors focus-visible:ring-3 focus-visible:ring-[var(--color-secondary)] outline-none sm:flex"
          >
            ↻
          </button>
        )}

        {/* Notification bell */}
        <NotificationBell />

        {/* User */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-white text-sm font-bold bg-[var(--color-secondary)] flex-shrink-0">
            {initials}
          </div>
          <div className="leading-tight hidden sm:block min-w-0">
            <div className="text-sm font-subtitles font-medium text-white truncate max-w-[120px] md:max-w-none">
              {userName}
            </div>
            <div className="text-xs font-subtitles text-white/70">
              {userRole}
            </div>
          </div>
        </div>

        {/* Logout — desktop only; mobile logout is in sidebar */}
        <button
          onClick={onLogout}
          className="btn-primary hidden md:inline-flex text-sm px-4 py-2 lg:px-5 lg:py-2.5 whitespace-nowrap"
        >
          Salir
        </button>

      </div>
    </header>
  )
}
