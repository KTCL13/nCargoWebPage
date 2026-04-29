import { prisma } from '@/lib/prisma'
import { Contract } from '@prisma/client'

class ContractRepository {
    // Obtener contratos de un empleado por su ID
    async findByEmployeeId(employeeId: number) {
        return prisma.contract.findMany({
            where: { employeeId },
        })
    }

    // Obtener el contrato activo de un empleado
    async findActiveContract(employeeId: number) {
        return prisma.contract.findFirst({
            where: {
                employeeId,
                isActive: true,
            },
        })
    }

    async getContractsByEmployeeId(employeeId: number): Promise<Contract[]> {
        return prisma.contract.findMany({
            where: { employeeId }
        })
    }

    async findById(id: number): Promise<Contract | null> {
        return prisma.contract.findUnique({ where: { id } })
    }

    // Crear un nuevo contrato
    async createContract(data: {
        employeeId: number
        jobId: number
        contractTypeId: number
        salary?: number
        hourlyRate?: number
        startDate: Date
        endDate?: Date
        isActive?: boolean
    }) {
        return prisma.contract.create({
            data: {
                employeeId: data.employeeId,
                jobId: data.jobId,
                contractTypeId: data.contractTypeId,
                salary: data.salary,
                hourlyRate: data.hourlyRate,
                startDate: data.startDate,
                endDate: data.endDate,
                isActive: data.isActive ?? true,
            },
        })
    }

    // Actualizar un contrato
    async updateContract(
        id: number,
        data: {
            jobId?: number
            contractTypeId?: number
            salary?: number
            hourlyRate?: number
            startDate?: Date
            endDate?: Date
            isActive?: boolean
        },
    ) {
        return prisma.contract.update({
            where: { id },
            data,
        })
    }

    // Desactivar el contrato anterior de un empleado
    async deactivatePrevious(employeeId: number) {
        await prisma.contract.updateMany({
            where: { employeeId, isActive: true },
            data: { isActive: false },
        })
    }
}

export const contractRepository = new ContractRepository()