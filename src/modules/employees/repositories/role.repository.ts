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
    // Asignar un rol a un empleado
    async assignRoleToEmployee(employeeId: number, roleId: number) {
        return prisma.employeeRole.create({
            data: {
                employeeId,
                roleId,
            },
        })
    }
}

export const roleRepository = new RoleRepository()