import { prisma } from '@/lib/prisma'
import { Employee, EmployeeStatus, IdentificationType, Prisma } from '@prisma/client'
import { FilterEmployeeDto } from '../dtos/filter-employee.dto'

const identificationTypeInclude = {
    identificationType: true,
} as const

class EmployeeRepository {
    async create(data: {
        firstName: string
        lastName: string
        identificationNumber: string
        identificationTypeId: number
        email: string
        passwordHash: string
        status: EmployeeStatus
        metadata?: Record<string, any>
    }) {
        return prisma.employee.create({
            data: {
                firstName: data.firstName,
                lastName: data.lastName,
                identificationNumber: data.identificationNumber,
                identificationTypeId: data.identificationTypeId,
                email: data.email,
                passwordHash: data.passwordHash,
                status: data.status,
                metadata: data.metadata ?? {},
            },
            include: identificationTypeInclude,
        })
    }

    async getEmployeeById(id: number) {
        return prisma.employee.findUnique({
            where: { id },
            include: identificationTypeInclude,
        })
    }

    async getEmployees(filter: FilterEmployeeDto): Promise<{ employees: (Employee & { identificationType: IdentificationType })[]; total: number }> {
        const { status, search, page = 1, limit = 10 } = filter

        const where: Prisma.EmployeeWhereInput = {
            ...(status && { status }),
            ...(search && {
                OR: [
                    { firstName: { contains: search, mode: 'insensitive' } },
                    { lastName:  { contains: search, mode: 'insensitive' } },
                    { email:     { contains: search, mode: 'insensitive' } },
                    { identificationNumber: { contains: search, mode: 'insensitive' } },
                ],
            }),
        }

        const [employees, total] = await Promise.all([
            prisma.employee.findMany({
                where,
                skip: (page - 1) * limit,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: identificationTypeInclude,
            }),
            prisma.employee.count({ where }),
        ])

        return { employees, total }
    }

    async updateEmployee(
        id: number,
        data: {
            firstName?: string
            lastName?: string
            identificationNumber?: string
            identificationTypeId?: number
            email?: string
            status?: EmployeeStatus
            metadata?: Record<string, any>
        },
    ) {
        return prisma.employee.update({
            where: { id },
            data,
            include: identificationTypeInclude,
        })
    }

    async deleteEmployee(id: number) {
        await prisma.employee.update({
            where: { id },
            data: { status: 'INACTIVE' },
        })
    }
}

export const employeeRepository = new EmployeeRepository()
