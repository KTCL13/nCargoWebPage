import { prisma } from '@/lib/prisma'
import crypto from 'crypto'

class PasswordResetRepository {
    async create(employeeId: number) {
        const token = crypto.randomBytes(32).toString('hex')
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000)
        return prisma.passwordResetToken.create({
            data: { token, employeeId, expiresAt },
        })
    }

    async findValid(token: string) {
        return prisma.passwordResetToken.findFirst({
            where: { token, usedAt: null, expiresAt: { gt: new Date() } },
        })
    }

    async markUsed(id: number) {
        return prisma.passwordResetToken.update({
            where: { id },
            data: { usedAt: new Date() },
        })
    }
}

export const passwordResetRepository = new PasswordResetRepository()
