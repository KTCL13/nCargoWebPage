import { cn } from '@/lib/utils'
import { ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  className?: string
}

export function Card({ children, className }: CardProps) {
  return (
    <div className={cn(
      "bg-white rounded-[var(--radius-xl)] border border-gray-100 shadow-sm overflow-hidden",
      className
    )}>
      {children}
    </div>
  )
}
