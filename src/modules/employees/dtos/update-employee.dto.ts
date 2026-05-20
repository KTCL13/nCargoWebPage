export type UpdateEmployeeDto = {
    firstName?: string
    lastName?: string
    identificationNumber?: string
    identificationTypeId?: number
    email?: string
    password?: string
    status?: 'ACTIVE' | 'INACTIVE'
    roleIds?: number[]
    metadata?: Record<string, any>
}
