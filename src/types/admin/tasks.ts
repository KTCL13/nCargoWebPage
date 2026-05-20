export type TaskStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'NOT_DONE'

export interface TaskEmployee {
  id: number
  firstName: string
  lastName: string
  email: string
}

export interface Task {
  id: number
  title: string
  description: string | null
  status: TaskStatus
  employeeId: number
  employee?: TaskEmployee
  createdBy: number
  assignedBy: number | null
  startTime: string | null
  endTime: string | null
  createdAt: string
}

export const STATUS_LABELS: Record<TaskStatus, string> = {
  PENDING: 'Pendiente',
  IN_PROGRESS: 'En Proceso',
  COMPLETED: 'Completado',
  CANCELLED: 'Cancelado',
  NOT_DONE: 'No Hecho',
}

export const STATUS_COLORS: Record<TaskStatus, string> = {
  PENDING: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  IN_PROGRESS: 'bg-blue-100 text-blue-700 border-blue-200',
  COMPLETED: 'bg-green-100 text-green-700 border-green-200',
  CANCELLED: 'bg-gray-100 text-gray-700 border-gray-200',
  NOT_DONE: 'bg-red-100 text-red-700 border-red-200',
}
