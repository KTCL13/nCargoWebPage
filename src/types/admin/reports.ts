export type Alert = {
  type: string
  severity: 'low' | 'medium' | 'high'
  employeeId: number
  employeeName: string
  detail: string
}
export type PerformanceEntry = {
  employeeId: number
  employeeName: string
  tasksCompleted: number
  avgCompletionMinutes: number | null
  totalWorkedHours: number
  notDoneCount: number
}
export type WorkloadEntry = {
  employeeId: number
  employeeName: string
  totalTasks: number
  pendingCount: number
  inProgressCount: number
  completedCount: number
  notDoneCount: number
}
export type CompletionEntry = {
  taskId: number
  title: string
  employeeId: number
  employeeName: string
  minutesSpent: number | null
}
export type Employee = { id: number; name: string }
export type AppliedFilters = { from: string; to: string; employeeId: string }

export const SEVERITY_ORDER: Record<string, number> = { high: 0, medium: 1, low: 2 }

export const SEVERITY_STYLES: Record<string, string> = {
  high: 'bg-red-100 text-red-700 border-red-200',
  medium: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  low: 'bg-gray-100 text-gray-600 border-gray-200',
}
export const SEVERITY_LABEL: Record<string, string> = { high: 'Alta', medium: 'Media', low: 'Baja' }
export const TYPE_LABEL: Record<string, string> = {
  UNCLOSED_ATTENDANCE: 'Jornada no cerrada',
  OVERDUE_TASK: 'Tarea no completada',
  NO_ACTIVITY: 'Sin actividad reciente',
  HIGH_NOT_DONE_RATE: 'Alta tasa de incumplimiento',
}
