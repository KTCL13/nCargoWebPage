'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { NavItem } from './Sidebar'

interface BottomNavProps {
  items: NavItem[]
  userRole: string
}

export function BottomNav({ items, userRole }: BottomNavProps) {
  const pathname = usePathname()

  // Filter items based on role, then take up to 4 items for bottom nav
  const visible = items
    .filter(item => !item.roles || item.roles.includes(userRole))
    .slice(0, 4)

  return (
    <nav className="md:hidden fixed bottom-0 left-0 w-full h-[65px] bg-[var(--color-foreground)]/98 backdrop-blur-md border-t border-white/10 shadow-[0_-4px_14px_rgba(4,6,38,0.3)] z-50 flex items-center justify-around px-2 pb-[safe-area-inset-bottom]">
      {visible.map((item) => {
        const isActive =
          pathname === item.href ||
          (item.href !== '/' && pathname.startsWith(item.href))

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`
              flex flex-col items-center justify-center w-full h-full gap-1
              transition-all duration-200
              ${isActive ? 'text-[var(--color-nc-red)]' : 'text-white/60 hover:text-white'}
            `}
            aria-current={isActive ? 'page' : undefined}
          >
            <span className={`text-xl ${isActive ? 'scale-110' : ''} transition-transform`}>
              {item.icon}
            </span>
            <span className={`text-[10px] font-subtitles font-medium truncate w-full text-center px-1 ${isActive ? 'font-bold' : ''}`}>
              {item.label}
            </span>
          </Link>
        )
      })}
    </nav>
  )
}
