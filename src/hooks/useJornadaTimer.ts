import { useState, useEffect, useRef } from 'react'
import { TimerState, AttendanceRecord, AttendanceEvent } from '@/lib/employee/jornada/types'

function calcWorkedSecs(events: AttendanceEvent[], now: Date) {
  let worked = 0; let lastIn: Date | null = null
  for (const ev of events) {
    const t = new Date(ev.timestamp)
    if (ev.type === 'CLOCK_IN' || ev.type === 'RESUME') lastIn = t
    else if ((ev.type === 'PAUSE' || ev.type === 'CLOCK_OUT') && lastIn) {
      worked += (t.getTime() - lastIn.getTime()) / 1000; lastIn = null
    }
  }
  if (lastIn) worked += (now.getTime() - lastIn.getTime()) / 1000
  return Math.floor(worked)
}

export function useJornadaTimer(attendance: AttendanceRecord | null, timerState: TimerState) {
  const [elapsed, setElapsed] = useState(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (attendance) {
      setElapsed(calcWorkedSecs(attendance.events, new Date()))
    } else {
      setElapsed(0)
    }
  }, [attendance])

  useEffect(() => {
    if (timerState === 'running') {
      intervalRef.current = setInterval(() => setElapsed(s => s + 1), 1000)
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [timerState])

  return { elapsed }
}
