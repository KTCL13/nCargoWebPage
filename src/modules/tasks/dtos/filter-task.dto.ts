import { TaskStatusName } from './task-status.type'

export type FilterTaskDto = {
    employeeId?: number
    status?: TaskStatusName
    page?: number
    limit?: number
}
