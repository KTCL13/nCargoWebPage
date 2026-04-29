export type BulkAssignTaskDto = {
    title: string
    description?: string
    employeeIds: number[]
    startTime?: Date
    endTime?: Date
    metadata?: Record<string, unknown>
}
