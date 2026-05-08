import { TaskStatusName } from './task-status.type'

export type UpdateTaskDto = {
    title?: string
    description?: string
    minutesSpent?: number
    endTime?: Date
    status?: TaskStatusName
    actorId?: number
}