import { TaskStatusName } from './task-status.type'

export type TaskResponseDto = {
    id: number
    title: string
    description: string | null
    status: TaskStatusName
    employeeId: number
    createdBy: number
    assignedBy: number | null
    startTime: Date | null
    endTime: Date | null
    minutesSpent: number | null
    metadata: Record<string, unknown> | null
    createdAt: Date
}
