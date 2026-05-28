import { prisma } from '@/lib/prisma'
import { UserSession } from '@prisma/client'

const MAX_CONCURRENT_SESSIONS = 3

class SessionRepository {
    async create(data: {
        employeeId: number
        ipAddress?: string
        deviceInfo?: object
        tokenJti?: string
    }): Promise<UserSession> {
        return prisma.userSession.create({
            data: {
                employeeId: data.employeeId,
                ipAddress: data.ipAddress,
                deviceInfo: data.deviceInfo,
                tokenJti: data.tokenJti,
            },
        })
    }

    async countActiveByEmployee(employeeId: number): Promise<number> {
        return prisma.userSession.count({
            where: { employeeId, logoutAt: null },
        })
    }

    async findOldestActiveByEmployee(employeeId: number): Promise<UserSession | null> {
        return prisma.userSession.findFirst({
            where: { employeeId, logoutAt: null },
            orderBy: { loginAt: 'asc' },
        })
    }

    async findActiveByEmployee(employeeId: number): Promise<UserSession | null> {
        return prisma.userSession.findFirst({
            where: { employeeId, logoutAt: null },
            orderBy: { loginAt: 'desc' },
        })
    }

    async findActiveByJti(jti: string): Promise<UserSession | null> {
        return prisma.userSession.findFirst({
            where: { tokenJti: jti, logoutAt: null },
        })
    }

    async closeSession(id: number, logoutAt: Date): Promise<UserSession> {
        return prisma.userSession.update({
            where: { id },
            data: { logoutAt },
        })
    }

    async closeSessionByJti(jti: string, logoutAt: Date): Promise<void> {
        await prisma.userSession.updateMany({
            where: { tokenJti: jti, logoutAt: null },
            data: { logoutAt },
        })
    }

    async closeAllActiveByEmployee(employeeId: number, logoutAt: Date): Promise<number> {
        const result = await prisma.userSession.updateMany({
            where: { employeeId, logoutAt: null },
            data: { logoutAt },
        })
        return result.count
    }

    /** Evicts the oldest active session if the employee is at the concurrent session limit. */
    async evictOldestIfAtLimit(employeeId: number): Promise<UserSession | null> {
        const count = await this.countActiveByEmployee(employeeId)
        if (count < MAX_CONCURRENT_SESSIONS) return null
        const oldest = await this.findOldestActiveByEmployee(employeeId)
        if (!oldest) return null
        await this.closeSession(oldest.id, new Date())
        return oldest
    }
}

export const sessionRepository = new SessionRepository()
