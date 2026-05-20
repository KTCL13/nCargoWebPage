export type AttendanceStatus = 'OPEN' | 'PAUSED' | 'CLOSED'
export type EventType = 'CLOCK_IN' | 'PAUSE' | 'RESUME' | 'CLOCK_OUT'
export type TimerState = 'idle' | 'running' | 'paused' | 'closed'

export interface AttendanceEvent {
  id: number
  type: EventType
  timestamp: string
}

export interface AttendanceRecord {
  id: number
  status: AttendanceStatus
  startedAt: string
  endedAt: string | null
  workedHours: number | null
  events: AttendanceEvent[]
}

export interface TaskItem {
  id: number
  title: string
  status: string
}
