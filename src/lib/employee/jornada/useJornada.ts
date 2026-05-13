import { useState, useEffect, useRef, useCallback } from 'react'
import { useAuth } from '@/context/AuthContext'
import { AttendanceRecord, TimerState, TaskItem, AttendanceEvent } from './types'

const MAX_SECS = 8 * 3600

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

export function useJornada() {
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
    (extra?: Record<string, string>): HeadersInit => {
      const h: Record<string, string> = { ...extra }
      if (token) h.Authorization = `Bearer ${token}`
      return h
    },
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
        setErrorMsg(res.status === 401 ? 'Sesión expirada, inicia sesión nuevamente.' : 'No se pudo cargar la jornada.')
        return
      }
      const data: AttendanceRecord | null = await res.json()
      applyAttendance(data)
      setErrorMsg(null)
    } catch (err) {
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
      // silent
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
        setErrorMsg(msg)
        return
      }
      applyAttendance(data as AttendanceRecord)
      await loadTasks()
    } catch (err) {
      setErrorMsg('Error de red')
    } finally {
      setLoading(false)
    }
  }

  const hoursToday = (elapsed / 3600).toFixed(1)
  const sessionStart = attendance
    ? new Date(attendance.startedAt).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })
    : '—'
  const stateLabel =
    timerState === 'running' ? 'Activa'
      : timerState === 'paused' ? 'Pausada'
        : timerState === 'closed' ? 'Cerrada'
          : 'Sin iniciar'

  return {
    employeeId, token,
    attendance, timerState, elapsed, pauseCount,
    loading, errorMsg, setErrorMsg,
    tasks, selectedTaskId, setSelectedTaskId, taskLoading,
    loadToday, handleCompleteTask,
    handleStart: () => callAction('/api/attendance/clock-in'),
    handlePause: () => callAction('/api/attendance/pause'),
    handleResume: () => callAction('/api/attendance/resume'),
    handleStop: () => callAction('/api/attendance/clock-out'),
    hoursToday, sessionStart, stateLabel,
    progress: Math.min(elapsed / MAX_SECS, 1)
  }
}
