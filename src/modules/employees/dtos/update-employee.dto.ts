// src/modules/employees/dtos/update-employee.dto.ts
export type UpdateEmployeeDto = {
    name?: string
    email?: string
    status?: 'ACTIVE' | 'INACTIVE'
    roleIds?: number[]
    metadata?: Record<string, any>
}