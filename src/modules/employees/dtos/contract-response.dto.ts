import { JobResponseDto } from "@/modules/jobs/dtos/job-response.dto"

export type ContractResponseDto = {
    id: number
    job: JobResponseDto
    contractType: { id: number; name: string }
    salary: number
    hourlyRate: number
    startDate: Date
    endDate: Date | null
    isActive: boolean
}