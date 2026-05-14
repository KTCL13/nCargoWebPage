'use client'

import React, { useEffect, useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'

// ── Types ─────────────────────────────────────────────────────────────────
type NotifItem = {
  id: number
  type: string
  message: string
  read: boolean
  metadata: Record<string, unknown> | null
  createdAt: string
}

type Toast = { id: number; message: string; type: 'info' | 'success' }

// ── Constants ─────────────────────────────────────────────────────────────
const PAGE_SIZE  = 8
const POLL_MS    = 30_000

const TYPE_CONFIG: Record<string, { label: string; icon: React.ReactNode; ring: string; bg: string }> = {
  // ── Employee notifications ──────────────────────────────────────────
  TASK_ASSIGNED: {
    label: 'Tarea asignada',
    icon:  <TaskIcon />,
    ring:  'ring-blue-200',
    bg:    'bg-blue-500',
  },
  TASK_REASSIGNED: {
    label: 'Tarea reasignada',
    icon:  <ShuffleIcon />,
    ring:  'ring-purple-200',
    bg:    'bg-purple-500',
  },
  TASK_NOT_DONE: {
    label: 'Tarea no completada',
    icon:  <WarnIcon />,
    ring:  'ring-rose-200',
    bg:    'bg-rose-500',
  },
}

// ── Helpers ───────────────────────────────────────────────────────────────
const TASK_TYPES = new Set(['TASK_ASSIGNED', 'TASK_REASSIGNED', 'TASK_NOT_DONE'])

function resolveNavUrl(type: string, metadata: Record<string, unknown> | null, role: string): string | null {
  if (!TASK_TYPES.has(type)) return null
  const taskId = metadata?.taskId as number | undefined
  if (role === 'ADMIN') {
    return taskId ? `/admin/tasks?taskId=${taskId}` : '/admin/tasks'
  }
  return '/employee/tareas'
}

function relFmt(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (diff < 60)     return 'ahora'
  if (diff < 3600)   return `hace ${Math.floor(diff / 60)}m`
  if (diff < 86400)  return `hace ${Math.floor(diff / 3600)}h`
  if (diff < 172800) return 'ayer'
  return new Date(iso).toLocaleDateString('es', { day: 'numeric', month: 'short' })
}

function playDing() {
  try {
    type AudioCtor = typeof AudioContext
    const win = window as Window & { webkitAudioContext?: AudioCtor }
    const AC: AudioCtor | undefined = window.AudioContext ?? win.webkitAudioContext
    if (!AC) return
    const ctx = new AC()
    ;([784, 1046.5] as number[]).forEach((hz, i) => {
      const osc  = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.type = 'sine'
      osc.frequency.value = hz
      const t = ctx.currentTime + i * 0.18
      gain.gain.setValueAtTime(0, t)
      gain.gain.linearRampToValueAtTime(0.3, t + 0.04)
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.5)
      osc.start(t)
      osc.stop(t + 0.5)
    })
  } catch { /* audio not available */ }
}

function plural(n: number, one: string, many: string) {
  return `${n} ${n === 1 ? one : many}`
}

// ── Main component ────────────────────────────────────────────────────────
export function NotificationBell() {
  const { token, user } = useAuth()
  const router = useRouter()

  const [open,       setOpen]       = useState(false)
  const [items,      setItems]      = useState<NotifItem[]>([])
  const [total,      setTotal]      = useState(0)
  const [unread,     setUnread]     = useState(0)
  const [page,       setPage]       = useState(1)
  const [loading,    setLoading]    = useState(false)
  const [toasts,     setToasts]     = useState<Toast[]>([])
  const [refreshKey, setRefreshKey] = useState(0)

  const wrapRef       = useRef<HTMLDivElement>(null)
  const prevUnreadRef = useRef<number | null>(null)

  // Stable auth header builder
  const authH = useCallback(
    (): Record<string, string> => (token ? { Authorization: `Bearer ${token}` } : {}),
    [token],
  )

  // ── Toast helpers ────────────────────────────────────────────────────
  const addToast = useCallback((message: string, type: Toast['type'] = 'info') => {
    const id = Date.now()
    setToasts(ts => [...ts, { id, message, type }])
    setTimeout(() => setToasts(ts => ts.filter(t => t.id !== id)), 5000)
  }, [])

  // ── Fetch one page of notifications ──────────────────────────────────
  const fetchPage = useCallback(async (p: number) => {
    if (!token) return
    setLoading(true)
    try {
      const res  = await fetch(`/api/notifications?pageSize=${PAGE_SIZE}&page=${p}`, { headers: authH() })
      const data = await res.json()
      setItems(data.data  ?? [])
      setTotal(data.total ?? 0)
    } catch { /* network error */ }
    setLoading(false)
  }, [token, authH])

  // ── Poll for unread count ────────────────────────────────────────────
  const checkUnread = useCallback(async () => {
    if (!token) return
    try {
      const res   = await fetch('/api/notifications?unread=true', { headers: authH() })
      const data  = await res.json()
      const count = (data.total ?? data.data?.length ?? 0) as number

      if (prevUnreadRef.current !== null && count > prevUnreadRef.current) {
        const diff = count - prevUnreadRef.current

        playDing()
        addToast(plural(diff, 'nueva notificación', 'nuevas notificaciones'), 'info')

        if (typeof window !== 'undefined' && 'Notification' in window) {
          if (Notification.permission === 'granted') {
            new window.Notification('nCargo', {
              body: `Tienes ${plural(count, 'notificación', 'notificaciones')} sin leer.`,
              icon: '/favicon.ico',
            })
          }
        }

        // Refresh list silently if panel is open
        setRefreshKey(k => k + 1)
      }

      prevUnreadRef.current = count
      setUnread(count)
    } catch { /* network error */ }
  }, [token, authH, addToast])

  // ── Effects ──────────────────────────────────────────────────────────

  // Initial unread check + browser notification permission
  useEffect(() => {
    checkUnread()
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  // Polling
  useEffect(() => {
    const id = setInterval(checkUnread, POLL_MS)
    return () => clearInterval(id)
  }, [checkUnread])

  // Fetch whenever the panel is open and page/refreshKey change
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (open) fetchPage(page)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, page, refreshKey])

  // Close on outside click / Escape
  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false)
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown',   onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown',   onKey)
    }
  }, [])

  // ── Actions ──────────────────────────────────────────────────────────

  const markRead = async (item: NotifItem) => {
    if (!item.read) {
      await fetch('/api/notifications', {
        method:  'PATCH',
        headers: { ...authH(), 'Content-Type': 'application/json' },
        body:    JSON.stringify({ id: item.id, read: true }),
      })
      setItems(ns => ns.map(n => n.id === item.id ? { ...n, read: true } : n))
      setUnread(c => Math.max(0, c - 1))
      if (prevUnreadRef.current !== null) prevUnreadRef.current = Math.max(0, prevUnreadRef.current - 1)
    }
    const url = resolveNavUrl(item.type, item.metadata, user?.role ?? '')
    if (url) { setOpen(false); router.push(url) }
  }

  const markAllRead = async () => {
    await fetch('/api/notifications', {
      method:  'PATCH',
      headers: { ...authH(), 'Content-Type': 'application/json' },
      body:    JSON.stringify({ all: true }),
    })
    setItems(ns => ns.map(n => ({ ...n, read: true })))
    setUnread(0)
    prevUnreadRef.current = 0
  }

  const deleteItem = async (id: number) => {
    const wasUnread = items.find(n => n.id === id)?.read === false
    await fetch(`/api/notifications?id=${id}`, { method: 'DELETE', headers: authH() })
    setItems(ns => ns.filter(n => n.id !== id))
    setTotal(t => Math.max(0, t - 1))
    if (wasUnread) {
      setUnread(c => Math.max(0, c - 1))
      if (prevUnreadRef.current !== null) prevUnreadRef.current = Math.max(0, prevUnreadRef.current - 1)
    }
  }

  const pageCount = Math.ceil(total / PAGE_SIZE)

  // ── Render ────────────────────────────────────────────────────────────
  return (
    <>
      {/* ── Bell button + dropdown ──────────────────────────────────── */}
      <div ref={wrapRef} className="relative">

        {/* Bell button */}
        <button
          onClick={() => { if (!open) setPage(1); setOpen(o => !o) }}
          aria-label="Ver notificaciones"
          aria-expanded={open}
          className="relative w-10 h-10 flex items-center justify-center rounded-[var(--radius-md)] text-white/80 hover:bg-white/10 hover:text-white focus-visible:ring-2 focus-visible:ring-[var(--color-secondary)] outline-none transition-colors"
        >
          <BellIcon className="w-[22px] h-[22px]" />
          {unread > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-[var(--color-nc-red)] text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none shadow-sm">
              {unread > 99 ? '99+' : unread}
            </span>
          )}
        </button>

        {/* Dropdown panel */}
        {open && (
          <div
            role="dialog"
            aria-label="Panel de notificaciones"
            className="absolute right-0 top-[calc(100%+12px)] w-[400px] max-w-[calc(100vw-20px)] bg-white rounded-2xl shadow-[0_12px_48px_rgba(4,6,38,0.18)] border border-gray-100/80 z-50 overflow-hidden"
            style={{ animation: 'nb-slide-in 0.15s ease-out' }}
          >
            <style>{`
              @keyframes nb-slide-in {
                from { opacity: 0; transform: scale(0.96) translateY(-6px); }
                to   { opacity: 1; transform: scale(1)    translateY(0);    }
              }
            `}</style>

            {/* ── Panel header ─────────────────────────────────────── */}
            <div className="flex items-center justify-between px-4 py-3.5 border-b border-gray-100">
              <div className="flex items-center gap-2.5">
                <BellIcon className="w-4 h-4 text-[var(--color-nc-dark)]" />
                <span className="font-titles text-[15px] font-bold text-[var(--color-nc-dark)]">
                  Notificaciones
                </span>
                {unread > 0 && (
                  <span className="px-1.5 py-0.5 bg-[var(--color-nc-red)] text-white text-[10px] font-bold rounded-full leading-none">
                    {unread}
                  </span>
                )}
              </div>
              {unread > 0 && (
                <button
                  onClick={markAllRead}
                  className="text-[11px] text-[var(--color-secondary)] font-semibold hover:opacity-75 transition-opacity whitespace-nowrap"
                >
                  Marcar todas como leídas
                </button>
              )}
            </div>

            {/* ── Notification list ─────────────────────────────────── */}
            <div className="max-h-[430px] overflow-y-auto overscroll-contain divide-y divide-gray-50">
              {loading ? (
                <LoadingRows />
              ) : items.length === 0 ? (
                <EmptyPanel />
              ) : (
                items.map(n => (
                  <NotifRow
                    key={n.id}
                    item={n}
                    role={user?.role ?? ''}
                    onMarkRead={() => markRead(n)}
                    onDelete={() => deleteItem(n.id)}
                  />
                ))
              )}
            </div>

            {/* ── Pagination footer ─────────────────────────────────── */}
            {total > 0 && (
              <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-t border-gray-100">
                <p className="text-[11px] text-gray-600">
                  Pág. {page} de {Math.max(pageCount, 1)} · {total} total
                </p>
                <div className="flex items-center gap-1.5">
                  <PanelNavBtn
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    ← Anterior
                  </PanelNavBtn>
                  <PanelNavBtn
                    onClick={() => setPage(p => Math.min(pageCount, p + 1))}
                    disabled={page >= pageCount}
                  >
                    Siguiente →
                  </PanelNavBtn>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Toast container ──────────────────────────────────────────────── */}
      <div
        aria-live="polite"
        aria-label="Notificaciones emergentes"
        className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-2 pointer-events-none"
      >
        {toasts.map(t => (
          <div
            key={t.id}
            className="pointer-events-auto flex items-center gap-3 bg-[var(--color-nc-dark)] text-white pl-4 pr-5 py-3.5 rounded-[var(--radius-lg)] shadow-lg text-sm font-medium"
            style={{ animation: 'nb-slide-in 0.2s ease-out' }}
          >
            <span className="text-base shrink-0">🔔</span>
            <span>{t.message}</span>
          </div>
        ))}
      </div>
    </>
  )
}

// ── Sub-components ────────────────────────────────────────────────────────

function NotifRow({
  item,
  role,
  onMarkRead,
  onDelete,
}: {
  item: NotifItem
  role: string
  onMarkRead: () => void
  onDelete: () => void
}) {
  const cfg = TYPE_CONFIG[item.type] ?? {
    label: item.type,
    icon:  <BellIcon className="w-4 h-4 text-white" />,
    ring:  'ring-gray-200',
    bg:    'bg-gray-500',
  }
  const navUrl = resolveNavUrl(item.type, item.metadata, role)
  const isClickable = !!navUrl

  return (
    <div
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
      className={`group flex items-start gap-3.5 px-4 py-3.5 transition-colors ${
        isClickable ? 'cursor-pointer' : 'cursor-default'
      } ${!item.read ? 'bg-blue-50/50 hover:bg-blue-50/80' : 'hover:bg-gray-50'}`}
      onClick={onMarkRead}
      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') onMarkRead() }}
    >
      {/* Type icon circle */}
      <div className={`shrink-0 w-10 h-10 rounded-full ring-2 ${cfg.ring} ${cfg.bg} flex items-center justify-center text-white shadow-sm`}>
        {cfg.icon}
      </div>

      {/* Text content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-0.5">
          <span className={`text-[12px] font-bold leading-tight ${item.read ? 'text-gray-500' : 'text-[var(--color-nc-dark)]'}`}>
            {cfg.label}
          </span>
          <span className="shrink-0 text-[10px] text-gray-600 mt-0.5 tabular-nums">
            {relFmt(item.createdAt)}
          </span>
        </div>

        <p className={`text-[12px] leading-relaxed line-clamp-2 ${item.read ? 'text-gray-600' : 'text-gray-600'}`}>
          {item.message}
        </p>

        {/* Action row */}
        <div className="flex items-center gap-3 mt-1.5">
          {isClickable && (
            <span className="text-[10px] font-semibold text-[var(--color-secondary)] group-hover:underline transition">
              Ver tarea →
            </span>
          )}
          {!item.read && (
            <button
              onClick={e => { e.stopPropagation(); onMarkRead() }}
              className="text-[10px] font-semibold text-gray-600 hover:text-[var(--color-secondary)] transition"
            >
              Marcar leída
            </button>
          )}
          <button
            onClick={e => { e.stopPropagation(); onDelete() }}
            className="text-[10px] font-semibold text-gray-600 hover:text-rose-500 transition-colors"
          >
            Eliminar
          </button>
        </div>
      </div>

      {/* Unread indicator dot */}
      {!item.read && (
        <div className="shrink-0 mt-2 w-2 h-2 rounded-full bg-[var(--color-nc-red)] shadow-sm" />
      )}
    </div>
  )
}

function LoadingRows() {
  return (
    <div className="p-4 space-y-4">
      {[1, 2, 3].map(i => (
        <div key={i} className="flex gap-3 animate-pulse">
          <div className="w-10 h-10 rounded-full bg-gray-100 shrink-0" />
          <div className="flex-1 space-y-2 pt-1">
            <div className="h-3 bg-gray-100 rounded w-1/3" />
            <div className="h-3 bg-gray-100 rounded w-full" />
            <div className="h-3 bg-gray-100 rounded w-2/3" />
          </div>
        </div>
      ))}
    </div>
  )
}

function EmptyPanel() {
  return (
    <div className="py-14 flex flex-col items-center gap-3 px-8">
      <div className="w-14 h-14 rounded-full bg-gray-50 border-2 border-gray-100 flex items-center justify-center">
        <BellIcon className="w-7 h-7 text-gray-500" />
      </div>
      <p className="text-sm font-semibold text-gray-600 text-center">Sin notificaciones</p>
      <p className="text-xs text-gray-500 text-center leading-relaxed">
        Aquí verás tus tareas asignadas y alertas del sistema.
      </p>
    </div>
  )
}

function PanelNavBtn({
  onClick,
  disabled,
  children,
}: {
  onClick: () => void
  disabled: boolean
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="px-2.5 py-1 text-[11px] font-semibold rounded-lg border border-gray-200 text-gray-600 bg-white hover:border-gray-300 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition"
    >
      {children}
    </button>
  )
}

// ── SVG icon components ───────────────────────────────────────────────────

function BellIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  )
}

function TaskIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4" aria-hidden="true">
      <path d="M9 11l3 3L22 4" />
      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
    </svg>
  )
}

function ShuffleIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4" aria-hidden="true">
      <polyline points="16 3 21 3 21 8" />
      <line x1="4" y1="20" x2="21" y2="3" />
      <polyline points="21 16 21 21 16 21" />
      <line x1="15" y1="15" x2="21" y2="21" />
      <line x1="4" y1="4" x2="9" y2="9" />
    </svg>
  )
}

function WarnIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4" aria-hidden="true">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  )
}
