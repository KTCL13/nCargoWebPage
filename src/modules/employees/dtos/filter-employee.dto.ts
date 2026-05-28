export type FilterEmployeeDto = {
    status?: 'ACTIVE' | 'INACTIVE'
    roleId?: number
    jobId?: number
    search?: string
    page?: number
    limit?: number
}