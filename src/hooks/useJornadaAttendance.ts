import { useState, useCallback, useEffect } from 'react'
import { AttendanceRecord, TimerState } from '@/lib/employee/jornada/types'
import { jornadaClient } from '@/lib/api-client/jornada'

function deriveTimerState(att: AttendanceRecord | null): TimerState {
  if (!att) return 'idle'
  if (att.status === 'OPEN') return 'running'
  if (att.status === 'PAUSED') return 'paused'
  return 'closed'
}

export function useJornadaAttendance(token: string | null) {
  const [attendance, setAttendance] = useState<AttendanceRecord | null>(null)
  const [timerState, setTimerState] = useState<TimerState>('idle')
  const [pauseCount, setPauseCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const applyAttendance = useCallback((att: AttendanceRecord | null) => {
    setAttendance(att)
    if (!att) {
      setTimerState('idle'); setPauseCount(0)
    } else {
      setPauseCount(att.events.filter(e => e.type === 'PAUSE').length)
      setTimerState(deriveTimerState(att))
    }
  }, [])

  const loadToday = useCallback(async () => {
    if (!token) return
    try {
      const data = await jornadaClient.getToday(token)
      applyAttendance(data); setErrorMsg(null)
    } catch (err: any) { setErrorMsg(err.message || 'Error al cargar') }
  }, [token, applyAttendance])

  async function callAction(path: string, afterCall?: () => void) {
    if (!token) return
    setLoading(true); setErrorMsg(null)
    try {
      const data = await jornadaClient.action(token, path)
      applyAttendance(data as AttendanceRecord)
      if (afterCall) afterCall()
    } catch (err: any) { setErrorMsg(err.message || 'Error de red') }
    finally { setLoading(false) }
  }

  useEffect(() => { if (token) loadToday() }, [token, loadToday])

  return { attendance, timerState, pauseCount, loading, errorMsg, setErrorMsg, loadToday, callAction }
}
