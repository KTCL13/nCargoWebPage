import { prisma } from '@/lib/prisma'

class RoleRepository {
    async findByName(name: string) {
        return prisma.role.findUnique({
            where: { name },
        })
    }

    async assignRoleToEmployee(employeeId: number, roleId: number) {
        return prisma.employeeRole.create({
            data: {
                employeeId,
                roleId,
            },
        })
    }

    async findIdentificationTypeByCode(code: string) {
        return prisma.identificationType.findUnique({ where: { code } })
    }
}

export const roleRepository = new RoleRepository()