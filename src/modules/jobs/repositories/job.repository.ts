import { prisma } from '@/lib/prisma'
import { Job } from '@prisma/client'
import { CreateJobDto } from '../dtos/create-job.dto'
import { UpdateJobDto } from '../dtos/update-job.dto'

class JobRepository {
    async findAll(skip?: number, take?: number, search?: string): Promise<Job[]> {
        const where = search ? { title: { contains: search, mode: 'insensitive' as const } } : undefined
        return prisma.job.findMany({ skip, take, where, orderBy: { title: 'asc' } })
    }

    async count(search?: string): Promise<number> {
        const where = search ? { title: { contains: search, mode: 'insensitive' as const } } : undefined
        return prisma.job.count({ where })
    }

    async findById(id: number): Promise<Job | null> {
        return prisma.job.findUnique({ where: { id } })
    }

    async findByTitle(title: string): Promise<Job | null> {
        return prisma.job.findFirst({
            where: { title: { equals: title, mode: 'insensitive' } },
        })
    }

    async create(data: CreateJobDto): Promise<Job> {
        return prisma.job.create({
            data: {
                title: data.title,
                description: data.description,
            },
        })
    }

    async update(id: number, data: UpdateJobDto): Promise<Job> {
        return prisma.job.update({
            where: { id },
            data,
        })
    }

    async delete(id: number): Promise<void> {
        await prisma.job.delete({ where: { id } })
    }
}

export const jobRepository = new JobRepository()
