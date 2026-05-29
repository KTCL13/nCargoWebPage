export type BulkAssignTaskDto = {
    title: string
    description?: string
    employeeIds: number[]
    startTime?: string
    endTime?: string
    metadata?: Record<string, unknown>
}
