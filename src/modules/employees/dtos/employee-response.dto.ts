import { ContractResponseDto } from "./contract-response.dto"

export type IdentificationTypeDto = {
    id: number
    code: string
    name: string
}

export type EmployeeResponseDto = {
    id: number
    firstName: string
    lastName: string
    name: string           // computed: `${firstName} ${lastName}` for backward compat
    identificationNumber: string
    identificationType: IdentificationTypeDto
    email: string
    status: 'ACTIVE' | 'INACTIVE'
    roles: string[]
    activeContract: ContractResponseDto | null
    createdAt: Date
}
