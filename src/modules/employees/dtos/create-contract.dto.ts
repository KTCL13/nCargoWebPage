// src/modules/employees/dtos/create-contract.dto.ts
export type CreateContractDto = {
    jobId: number
    contractTypeId: number
    salary: number
    hourlyRate: number
    startDate: Date
    endDate?: Date
}