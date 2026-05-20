export type TaskStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'NOT_DONE'
export type AttendanceStatus = 'OPEN' | 'PAUSED' | 'CLOSED' | null

export interface Task {
  id: number
  title: string
  description: string | null
  status: TaskStatus
  employeeId: number
  createdBy: number
  startTime: string | null
  endTime: string | null
  createdAt: string
}

export interface Column {
  statuses: TaskStatus[]
  label: string
  dot: string
  archived?: boolean
}
