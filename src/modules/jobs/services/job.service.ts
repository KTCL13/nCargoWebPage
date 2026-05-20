import { jobRepository } from '../repositories/job.repository'
import { CreateJobDto } from '../dtos/create-job.dto'
import { UpdateJobDto } from '../dtos/update-job.dto'
import { JobResponseDto } from '../dtos/job-response.dto'
import { Job } from '@prisma/client'

class JobService {
    private toJobResponseDto(job: Job): JobResponseDto {
        return {
            id: job.id,
            title: job.title,
            description: job.description,
        }
    }

    async findAll(page: number = 1, limit: number = 10): Promise<{ data: JobResponseDto[], total: number }> {
        const skip = (page - 1) * limit
        const [jobs, total] = await Promise.all([
            jobRepository.findAll(skip, limit),
            jobRepository.count()
        ])

        return {
            data: jobs.map((job: Job) => this.toJobResponseDto(job)),
            total
        }
    }

    async findOne(id: number): Promise<JobResponseDto> {
        const job = await jobRepository.findById(id)

        if (!job) {
            throw new Error(`Job not found with id ${id}`)
        }

        return this.toJobResponseDto(job)
    }

    async create(data: CreateJobDto): Promise<JobResponseDto> {
        const job = await jobRepository.create(data)
        return this.toJobResponseDto(job)
    }

    async update(id: number, data: UpdateJobDto): Promise<JobResponseDto> {
        const job = await jobRepository.update(id, data)
        return this.toJobResponseDto(job)
    }

    async remove(id: number): Promise<void> {
        await jobRepository.delete(id)
    }
}

export const jobService = new JobService()
