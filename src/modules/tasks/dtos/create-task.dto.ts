export type CreateTaskDto = {
    title: string
    description?: string
    employeeId: number
    startTime?: string
    endTime?: string
    metadata?: Record<string, unknown>
}