import { prisma } from '@/lib/prisma'

class UserRepository {
    async findByEmail(email: string) {
        return prisma.employee.findUnique({
            where: { email },
            include: {
                employeeRoles: {
                    include: {
                        role: true,
                    },
                },
            },
        })
    }

    async create(data: {
        name: string
        email: string
        passwordHash: string
    }) {
        return prisma.employee.create({
            data: {
                name: data.name,
                email: data.email,
                passwordHash: data.passwordHash,
            },
        })
    }

    async updatePassword(id: number, passwordHash: string) {
        return prisma.employee.update({ where: { id }, data: { passwordHash } })
    }
}

export const userRepository = new UserRepository()