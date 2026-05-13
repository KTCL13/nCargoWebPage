import { useAuth } from '@/context/AuthContext'
import { useJornadaTimer } from '@/hooks/useJornadaTimer'
import { useJornadaTasks } from '@/hooks/useJornadaTasks'
import { useJornadaAttendance } from '@/hooks/useJornadaAttendance'

const MAX_SECS = 8 * 3600

export function useJornada() {
  const { user, token } = useAuth()
  const employeeId = user?.id ?? null

  const att = useJornadaAttendance(token)
  const tasks = useJornadaTasks(token, employeeId)
  const timer = useJornadaTimer(att.attendance, att.timerState)

  const hoursToday = (timer.elapsed / 3600).toFixed(1)
  const sessionStart = att.attendance
    ? new Date(att.attendance.startedAt).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })
    : '—'
  const stateLabel =
    att.timerState === 'running' ? 'Activa'
      : att.timerState === 'paused' ? 'Pausada'
        : att.timerState === 'closed' ? 'Cerrada' : 'Sin iniciar'

  return {
    employeeId, token,
    ...att, ...tasks, ...timer,
    handleStart: () => att.callAction('/api/attendance/clock-in', tasks.loadTasks),
    handlePause: () => att.callAction('/api/attendance/pause', tasks.loadTasks),
    handleResume: () => att.callAction('/api/attendance/resume', tasks.loadTasks),
    handleStop: () => att.callAction('/api/attendance/clock-out', tasks.loadTasks),
    hoursToday, sessionStart, stateLabel,
    progress: Math.min(timer.elapsed / MAX_SECS, 1)
  }
}
