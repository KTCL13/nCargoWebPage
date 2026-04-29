import { prisma } from '@/lib/prisma'
import { TaskStatus } from '@prisma/client'
import { TaskStatusName } from '../dtos/task-status.type'

class TaskStatusRepository {
    async findByName(name: TaskStatusName): Promise<TaskStatus | null> {
        return prisma.taskStatus.findUnique({ where: { name } })
    }

    async findById(id: number): Promise<TaskStatus | null> {
        return prisma.taskStatus.findUnique({ where: { id } })
    }
}

export const taskStatusRepository = new TaskStatusRepository()
