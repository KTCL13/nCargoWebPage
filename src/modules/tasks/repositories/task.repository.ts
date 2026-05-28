import { prisma } from '@/lib/prisma'
import { Task, Prisma } from '@prisma/client'
import { FilterTaskDto } from '../dtos/filter-task.dto'

class TaskRepository {
    async findAll(filter: FilterTaskDto): Promise<Task[]> {
        const page = filter.page || 1
        const limit = filter.limit || 10

        const where: Prisma.TaskWhereInput = {}

        if (filter.employeeId) {
            where.employeeId = filter.employeeId
        }

        if (filter.status) {
            where.status = { name: filter.status }
        }

        return prisma.task.findMany({
            where,
            skip: (page - 1) * limit,
            take: limit,
            orderBy: { createdAt: 'desc' },
        })
    }

    async count(filter: FilterTaskDto): Promise<number> {
        const where: Prisma.TaskWhereInput = {}

        if (filter.employeeId) {
            where.employeeId = filter.employeeId
        }

        if (filter.status) {
            where.status = { name: filter.status }
        }

        return prisma.task.count({ where })
    }

    async findById(id: number): Promise<Task | null> {
        return prisma.task.findUnique({ where: { id } })
    }

    async findOverduePending(): Promise<Task[]> {
        const pendingStatus = await prisma.taskStatus.findUnique({
            where: { name: 'PENDING' },
        })

        if (!pendingStatus) return []

        return prisma.task.findMany({
            where: {
                statusId: pendingStatus.id,
                endTime: { lt: new Date() },
            },
        })
    }

    async findDueSoon(): Promise<Task[]> {
        const now = new Date()
        const in70min = new Date(now.getTime() + 70 * 60 * 1000)

        const [pendingStatus, inProgressStatus] = await Promise.all([
            prisma.taskStatus.findUnique({ where: { name: 'PENDING' } }),
            prisma.taskStatus.findUnique({ where: { name: 'IN_PROGRESS' } }),
        ])

        const statusIds = [pendingStatus?.id, inProgressStatus?.id].filter((id): id is number => id !== undefined)
        if (statusIds.length === 0) return []

        const tasks = await prisma.task.findMany({
            where: {
                statusId: { in: statusIds },
                endTime: { gt: now, lte: in70min },
            },
        })

        // exclude tasks already warned via metadata flag
        return tasks.filter(t => {
            const meta = t.metadata as Record<string, unknown> | null
            return !meta?.dueSoonWarned
        })
    }

    // 🔥 FIX AQUÍ
    async create(data: {
        title: string
        description?: string
        employeeId: number
        createdBy: number
        assignedBy?: number
        statusId: number
        startTime?: Date
        endTime?: Date
        metadata?: Prisma.InputJsonValue
    }): Promise<Task> {
        return prisma.task.create({
            data: {
                title: data.title,
                description: data.description,

                // ✅ RELACIÓN EMPLOYEE
                employee: {
                    connect: { id: data.employeeId },
                },

                createdBy: data.createdBy,

                // 🔥 FIX REAL AQUÍ
                ...(data.assignedBy !== undefined && {
                    assignedByEmployee: {
                        connect: { id: data.assignedBy },
                    },
                }),

                // ✅ RELACIÓN STATUS
                status: {
                    connect: { id: data.statusId },
                },

                startTime: data.startTime ?? null,
                endTime: data.endTime ?? null,

                metadata: data.metadata ?? undefined,
            },
        })
    }

    async update(id: number, data: Prisma.TaskUpdateInput): Promise<Task> {
        return prisma.task.update({
            where: { id },
            data,
        })
    }

    async delete(id: number): Promise<Task> {
        return prisma.task.delete({ where: { id } })
    }
}

export const taskRepository = new TaskRepository()