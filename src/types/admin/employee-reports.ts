export type Range = '7d' | '30d' | '90d' | 'all'

export type KPIRecord = {
  id: number
  employeeId: number
  date: string
  tasksCompleted: number
  tasksPending: number
  avgTaskTimeMinutes: number | null
  totalWorkedHours: number | null
  productivityScore: number | null
  employee: { id: number; name: string }
}

export type Metrics = {
  totalWorkedHours: number
  totalTasksCompleted: number
  avgProductivity: number | null
  avgTaskTime: number | null
}

export type TimePoint = {
  date: string
  workedHours: number
  tasksCompleted: number
  productivityScore: number | null
}

export type EmployeeRow = {
  employeeId: number
  name: string
  totalWorkedHours: number
  tasksCompleted: number
  avgTaskTime: number | null
  avgProductivity: number | null
}
