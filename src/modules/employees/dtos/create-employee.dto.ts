export type CreateEmployeeDto = {
    name: string
    email: string
    password: string
    status: 'ACTIVE' | 'INACTIVE'
    roleIds: number[]
    metadata?: Record<string, any>
}