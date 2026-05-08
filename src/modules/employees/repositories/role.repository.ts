import { prisma } from '@/lib/prisma'
import { Role } from '@prisma/client'

class RoleRepository {
    // Buscar roles por ID
    async findByIds(ids: number[]) {
        return prisma.role.findMany({
            where: {
                id: {
                    in: ids,
                },
            },
        })
    }

    // Obtener todos los roles
    async findAll() {
        return prisma.role.findMany()
    }
    async getRolesByEmployeeId(employeeId: number): Promise<Role[]> {
        return prisma.role.findMany({
            where: {
                employeeRoles: {
                    some: { employeeId }
                }
            }
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

    async findByName(name: string) {
        return prisma.role.findFirst({ where: { name } })
    }

    async findIdentificationTypeByCode(code: string) {
        return prisma.identificationType.findUnique({ where: { code } })
    }

    async findAllIdentificationTypes() {
        return prisma.identificationType.findMany({ orderBy: { code: 'asc' } })
    }
}

export const roleRepository = new RoleRepository()