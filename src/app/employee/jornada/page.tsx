'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { NAV_ITEMS } from '@/components/layout/nav-config'
import { useAuth } from '@/context/AuthContext'

const MAX_SECS = 8 * 3600

type AttendanceStatus = 'OPEN' | 'PAUSED' | 'CLOSED'
type EventType = 'CLOCK_IN' | 'PAUSE' | 'RESUME' | 'CLOCK_OUT'
type TimerState = 'idle' | 'running' | 'paused' | 'closed'

interface AttendanceEvent {
  id: number
  type: EventType
  timestamp: string
}

interface AttendanceRecord {
  id: number
  status: AttendanceStatus
  startedAt: string
  endedAt: string | null
  workedHours: number | null
  events: AttendanceEvent[]
}

interface TaskItem {
  id: number
  title: string
  status: string
}

function formatHMS(secs: number) {
  const h = Math.floor(secs / 3600)
  const m = Math.floor((secs % 3600) / 60)
  const s = secs % 60
  return [h, m, s].map(n => String(n).padStart(2, '0')).join(':')
}

function calcWorkedSecs(events: AttendanceEvent[], now: Date) {
  let worked = 0
  let lastIn: Date | null = null
  for (const ev of events) {
    const t = new Date(ev.timestamp)
    if (ev.type === 'CLOCK_IN' || ev.type === 'RESUME') lastIn = t
    else if ((ev.type === 'PAUSE' || ev.type === 'CLOCK_OUT') && lastIn) {
      worked += (t.getTime() - lastIn.getTime()) / 1000
      lastIn = null
    }
  }
  if (lastIn) worked += (now.getTime() - lastIn.getTime()) / 1000
  return Math.floor(worked)
}

function deriveTimerState(att: AttendanceRecord | null): TimerState {
  if (!att) return 'idle'
  if (att.status === 'OPEN') return 'running'
  if (att.status === 'PAUSED') return 'paused'
  return 'closed'
}

export default function JornadaPage() {
  const { user, token } = useAuth()
  const employeeId = user?.id ?? null

  const [attendance, setAttendance] = useState<AttendanceRecord | null>(null)
  const [timerState, setTimerState] = useState<TimerState>('idle')
  const [elapsed, setElapsed] = useState(0)
  const [pauseCount, setPauseCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const [tasks, setTasks] = useState<TaskItem[]>([])
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null)
  const [taskLoading, setTaskLoading] = useState(false)

  const authHeaders = useCallback(
    (extra?: Record<string, string>) => ({
      ...(extra ?? {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    }),
    [token],
  )

  const applyAttendance = useCallback((att: AttendanceRecord | null) => {
    if (!att) {
      setAttendance(null)
      setTimerState('idle')
      setElapsed(0)
      setPauseCount(0)
      return
    }
    setAttendance(att)
    setPauseCount(att.events.filter(e => e.type === 'PAUSE').length)
    setElapsed(calcWorkedSecs(att.events, new Date()))
    setTimerState(deriveTimerState(att))
  }, [])

  const loadToday = useCallback(async () => {
    if (!token) return
    try {
      const res = await fetch(`/api/attendance/today?_=${Date.now()}`, {
        headers: authHeaders(),
        cache: 'no-store',
      })
      if (!res.ok) {
        const msg = await res.text()
        console.error('[jornada] GET /today failed:', res.status, msg)
        setErrorMsg(res.status === 401 ? 'Sesión expirada, inicia sesión nuevamente.' : 'No se pudo cargar la jornada.')
        return
      }
      const data: AttendanceRecord | null = await res.json()
      applyAttendance(data)
      setErrorMsg(null)
    } catch (err) {
      console.error('[jornada] GET /today error:', err)
      setErrorMsg('Error de red al cargar la jornada.')
    }
  }, [token, authHeaders, applyAttendance])

  const loadTasks = useCallback(async () => {
    if (!token || !employeeId) return
    try {
      const [pendingRes, inProgressRes] = await Promise.all([
        fetch(`/api/tasks?employeeId=${employeeId}&status=PENDING&limit=50`, { headers: authHeaders() }),
        fetch(`/api/tasks?employeeId=${employeeId}&status=IN_PROGRESS&limit=50`, { headers: authHeaders() }),
      ])
      const [pending, inProgress] = await Promise.all([
        pendingRes.ok ? pendingRes.json() : { data: [] },
        inProgressRes.ok ? inProgressRes.json() : { data: [] },
      ])
      const combined: TaskItem[] = [
        ...(pending.data ?? pending ?? []),
        ...(inProgress.data ?? inProgress ?? []),
      ].map((t: any) => ({ id: t.id, title: t.title, status: t.status }))
      setTasks(combined)
    } catch {
      // silent — task list is best-effort
    }
  }, [token, employeeId, authHeaders])

  const handleCompleteTask = async () => {
    if (!selectedTaskId || !token) return
    setTaskLoading(true)
    try {
      const res = await fetch(`/api/tasks?id=${selectedTaskId}`, {
        method: 'PUT',
        headers: authHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ status: 'COMPLETED', endTime: new Date() }),
      })
      if (res.ok) {
        setSelectedTaskId(null)
        await loadTasks()
      }
    } catch {
      // silent
    } finally {
      setTaskLoading(false)
    }
  }

  useEffect(() => {
    if (token) loadToday()
  }, [token, loadToday])

  useEffect(() => {
    if (token && employeeId) loadTasks()
  }, [token, employeeId, loadTasks])

  useEffect(() => {
    if (timerState === 'running') {
      intervalRef.current = setInterval(() => setElapsed(s => s + 1), 1000)
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [timerState])

  async function callAction(path: string) {
    if (!token) return
    setLoading(true)
    setErrorMsg(null)
    try {
      const res = await fetch(path, {
        method: 'POST',
        headers: authHeaders({ 'Content-Type': 'application/json' }),
        cache: 'no-store',
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) {
        const msg = (data && typeof data === 'object' && 'message' in data ? (data as { message: string }).message : '') || 'Error en la operación'
        console.error('[jornada] POST', path, 'failed:', res.status, msg)
        setErrorMsg(msg)
        return
      }
      applyAttendance(data as AttendanceRecord)
      await loadTasks()
    } catch (err) {
      console.error('[jornada] POST', path, 'error:', err)
      setErrorMsg('Error de red')
    } finally {
      setLoading(false)
    }
  }

  const handleStart = () => callAction('/api/attendance/clock-in')
  const handlePause = () => callAction('/api/attendance/pause')
  const handleResume = () => callAction('/api/attendance/resume')
  const handleStop = () => callAction('/api/attendance/clock-out')

  const progress = Math.min(elapsed / MAX_SECS, 1)
  const circumference = 2 * Math.PI * 90
  const strokeDash = circumference * progress

  const hoursToday = (elapsed / 3600).toFixed(1)
  const sessionStart = attendance
    ? new Date(attendance.startedAt).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })
    : '—'
  const stateLabel =
    timerState === 'running' ? 'Activa'
      : timerState === 'paused' ? 'Pausada'
        : timerState === 'closed' ? 'Cerrada'
          : 'Sin iniciar'

  if (!employeeId) {
    return (
      <DashboardLayout pageTitle="Jornada laboral" navItems={NAV_ITEMS} onReload={() => loadToday()}>
        <div className="text-center py-16 text-[var(--color-nc-dark)]/40 font-subtitles">Verificando sesión…</div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout
      pageTitle="Jornada laboral"
      navItems={NAV_ITEMS}
      onReload={() => loadToday()}
    >
      <h2 className="font-titles text-2xl font-extrabold text-[var(--color-nc-dark)]">
        Jornada laboral
      </h2>

      {errorMsg && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-subtitles text-red-700">
          {errorMsg}
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: '⏱️', label: 'Horas hoy', value: `${hoursToday}h` },
          { icon: '✅', label: 'Sesiones', value: attendance ? '1' : '0' },
          { icon: '⏸️', label: 'Pausas', value: pauseCount },
          { icon: '📍', label: 'Estado', value: stateLabel },
        ].map(card => (
          <div key={card.label} className="flex items-center gap-3 bg-[var(--color-nc-dark)] rounded-2xl px-5 py-4">
            <div className="w-10 h-10 rounded-xl bg-[var(--color-nc-blue)] flex items-center justify-center text-lg flex-shrink-0">
              {card.icon}
            </div>
            <div>
              <p className="font-subtitles text-[11px] text-white/60 uppercase tracking-wide">{card.label}</p>
              <p className="font-titles text-xl font-extrabold text-white leading-tight">{card.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Timer + Controls */}
      <div className="grid grid-cols-1 md:grid-cols-[1fr_320px] gap-6">

        {/* Timer Ring */}
        <div className="bg-white rounded-2xl border border-black/5 shadow-sm flex flex-col items-center justify-center gap-4 py-10 px-6">
          <p className="font-subtitles text-sm text-[var(--color-nc-dark)]/60 uppercase tracking-wide">
            Sesión de Trabajo Actual
          </p>

          <div className="relative w-[200px] h-[200px]">
            <svg viewBox="0 0 200 200" className="w-full h-full -rotate-90">
              <defs>
                <linearGradient id="timerGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#FF003B" />
                  <stop offset="100%" stopColor="#0C1E8C" />
                </linearGradient>
              </defs>
              <circle cx="100" cy="100" r="90" fill="none" stroke="#E4E6EA" strokeWidth="12" />
              <circle
                cx="100" cy="100" r="90" fill="none"
                stroke="url(#timerGrad)" strokeWidth="12"
                strokeLinecap="round"
                strokeDasharray={`${strokeDash} ${circumference}`}
                style={{ transition: 'stroke-dasharray 0.5s ease' }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-titles text-3xl font-extrabold text-[var(--color-nc-dark)] tabular-nums">
                {formatHMS(elapsed)}
              </span>
              <span className="font-subtitles text-xs text-[var(--color-nc-dark)]/50 mt-1">
                {stateLabel}
              </span>
            </div>
          </div>

          <div className="mt-2 flex items-center gap-2 w-full max-w-sm">
            <div className="flex items-center gap-2 flex-1 px-4 py-2 rounded-full bg-[var(--color-nc-dark)]/5 min-w-0">
              <span className="text-sm flex-shrink-0">🎯</span>
              {timerState === 'idle' || timerState === 'closed' ? (
                <span className="font-subtitles text-sm text-[var(--color-nc-dark)]/60 truncate">
                  Tarea actual: —
                </span>
              ) : tasks.length === 0 ? (
                <span className="font-subtitles text-sm text-[var(--color-nc-dark)]/50 truncate">
                  Sin tareas pendientes
                </span>
              ) : (
                <select
                  value={selectedTaskId ?? ''}
                  onChange={e => setSelectedTaskId(e.target.value ? Number(e.target.value) : null)}
                  className="flex-1 bg-transparent font-subtitles text-sm text-[var(--color-nc-dark)] outline-none cursor-pointer min-w-0"
                >
                  <option value="">— Seleccionar tarea —</option>
                  {tasks.map(t => (
                    <option key={t.id} value={t.id}>{t.title}</option>
                  ))}
                </select>
              )}
            </div>
            {selectedTaskId !== null && (timerState === 'running' || timerState === 'paused') && (
              <button
                onClick={handleCompleteTask}
                disabled={taskLoading}
                title="Marcar como completada"
                className="w-9 h-9 flex-shrink-0 rounded-full bg-green-500 hover:bg-green-600 flex items-center justify-center text-white font-bold text-base transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                ✓
              </button>
            )}
          </div>
        </div>

        {/* Control Panel */}
        <div className="bg-white rounded-2xl border border-black/5 shadow-sm p-6 flex flex-col gap-3">
          <div>
            <p className="font-titles text-base font-bold text-[var(--color-nc-dark)]">Panel de Control</p>
            <p className="font-subtitles text-xs text-[var(--color-nc-dark)]/50 mt-0.5">Registra tus horas de trabajo</p>
          </div>

          <button
            onClick={handleStart}
            disabled={timerState !== 'idle' || loading}
            className="w-full py-3 rounded-full text-sm font-bold font-subtitles text-white transition-all
              bg-[var(--color-nc-red)] hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            ▶ INICIAR
          </button>
          <button
            onClick={handlePause}
            disabled={timerState !== 'running' || loading}
            className="w-full py-3 rounded-full text-sm font-bold font-subtitles text-white transition-all
              bg-[var(--color-nc-dark)] hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            ⏸ PAUSAR
          </button>
          <button
            onClick={handleResume}
            disabled={timerState !== 'paused' || loading}
            className="w-full py-3 rounded-full text-sm font-bold font-subtitles text-white transition-all
              bg-amber-500 hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            ↺ REANUDAR
          </button>
          <button
            onClick={handleStop}
            disabled={(timerState !== 'running' && timerState !== 'paused') || loading}
            className="w-full py-3 rounded-full text-sm font-bold font-subtitles transition-all
              border-2 border-[var(--color-nc-dark)]/20 text-[var(--color-nc-dark)] hover:bg-black/5
              disabled:opacity-40 disabled:cursor-not-allowed"
          >
            ■ FINALIZAR
          </button>

          <hr className="border-black/8 my-1" />

          <div className="flex flex-col gap-2">
            {[
              { label: 'Inicio de sesión', value: sessionStart },
              { label: 'Pausas', value: pauseCount },
              { label: 'Estado', value: stateLabel },
            ].map(row => (
              <div key={row.label} className="flex justify-between items-center text-sm">
                <span className="font-subtitles text-[var(--color-nc-dark)]/50">{row.label}</span>
                <strong className="font-subtitles font-semibold text-[var(--color-nc-dark)]">{row.value}</strong>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
