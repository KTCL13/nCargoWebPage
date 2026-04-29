import { TaskResponseDto } from './task-response.dto'

export type PaginatedResponseDto = {
    data: TaskResponseDto[]
    total: number
    page: number
    limit: number
}
