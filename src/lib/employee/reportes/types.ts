export interface AttendanceRecord {
  id: number
  status: 'OPEN' | 'PAUSED' | 'CLOSED'
  startedAt: string
  endedAt: string | null
  workedHours: string | number | null
}

export interface TaskRecord {
  id: number
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'NOT_DONE' | 'CANCELLED'
}
