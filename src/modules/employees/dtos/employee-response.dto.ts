import { ContractResponseDto } from "./contract-response.dto"

export type EmployeeResponseDto = {
    id: number
    name: string
    email: string
    status: 'ACTIVE' | 'INACTIVE'
    roles: string[]
    activeContract: ContractResponseDto | null
    createdAt: Date
}