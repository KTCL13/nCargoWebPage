import { prisma } from '@/lib/prisma'

class UserRepository {
    async findByEmail(email: string) {
        return prisma.employee.findUnique({
            where: { email },
            include: {
                identificationType: true,
                employeeRoles: {
                    include: {
                        role: true,
                    },
                },
            },
        })
    }

    async create(data: {
        firstName: string
        lastName: string
        identificationNumber: string
        identificationTypeId: number
        email: string
        passwordHash: string
    }) {
        return prisma.employee.create({
            data: {
                firstName: data.firstName,
                lastName: data.lastName,
                identificationNumber: data.identificationNumber,
                identificationTypeId: data.identificationTypeId,
                email: data.email,
                passwordHash: data.passwordHash,
            },
            include: {
                identificationType: true,
            },
        })
    }

    async updatePassword(id: number, passwordHash: string) {
        return prisma.employee.update({ where: { id }, data: { passwordHash } })
    }
}

export const userRepository = new UserRepository()
