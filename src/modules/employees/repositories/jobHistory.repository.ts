import { prisma } from '@/lib/prisma'
import { JobHistory } from '@prisma/client'

class JobHistoryRepository {
    // Obtener todo el historial de trabajos de un empleado
    async findAll(employeeId: number) {
        return prisma.jobHistory.findMany({
            where: { employeeId },
        })
    }

    // Crear un nuevo historial de trabajo
    async create(data: Omit<JobHistory, 'id'>): Promise<JobHistory> {
        return prisma.jobHistory.create({
            data,  // Prisma se encarga de crear el id automáticamente
        })
    }
    async getJobHistoryByEmployeeId(employeeId: number): Promise<JobHistory[]> {
        return prisma.jobHistory.findMany({
            where: { employeeId },
        })
    }

    // Actualizar un historial de trabajo
    async update(id: number, data: Partial<JobHistory>) {
        return prisma.jobHistory.update({
            where: { id },
            data,
        })
    }
}

export const jobHistoryRepository = new JobHistoryRepository()