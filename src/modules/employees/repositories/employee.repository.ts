import { prisma } from '@/lib/prisma'
import { Employee, EmployeeStatus, Prisma } from '@prisma/client'
import { FilterEmployeeDto } from '../dtos/filter-employee.dto'

class EmployeeRepository {
    async create(data: {
        name: string
        email: string
        passwordHash: string
        status: EmployeeStatus
        metadata?: Record<string, any>
    }) {
        return prisma.employee.create({
            data: {
                name: data.name,
                email: data.email,
                passwordHash: data.passwordHash,
                status: data.status,
                metadata: data.metadata ?? {},
            },
        })
    }

    async getEmployeeById(id: number) {
        return prisma.employee.findUnique({
            where: { id },
        })
    }

    async getEmployees(filter: FilterEmployeeDto): Promise<{ employees: Employee[]; total: number }> {
        const { status, search, page = 1, limit = 10 } = filter

        const where: Prisma.EmployeeWhereInput = {
            ...(status && { status }),
            ...(filter.roleId && {
                employeeRoles: {
                    some: {
                        roleId: filter.roleId,
                    },
                },
            }),
            ...(search && {
                OR: [
                    { name: { contains: search, mode: 'insensitive' } },
                    { email: { contains: search, mode: 'insensitive' } },
                    {
                        metadata: {
                            path: ['identification'],
                            string_contains: search,
                        },
                    },
                ],
            }),
        }

        const [employees, total] = await Promise.all([
            prisma.employee.findMany({
                where,
                skip: (page - 1) * limit,
                take: limit,
                orderBy: { createdAt: 'desc' },
            }),
            prisma.employee.count({ where }),
        ])

        return { employees, total }
    }

    async updateEmployee(
        id: number,
        data: {
            name?: string
            email?: string
            status?: EmployeeStatus
            metadata?: Record<string, any>
        },
    ) {
        return prisma.employee.update({
            where: { id },
            data,
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