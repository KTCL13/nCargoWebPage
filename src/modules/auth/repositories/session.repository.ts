import { prisma } from '@/lib/prisma'
import { UserSession } from '@prisma/client'

class SessionRepository {
    async create(data: {
        employeeId: number
        ipAddress?: string
        deviceInfo?: object
    }): Promise<UserSession> {
        return prisma.userSession.create({
            data: {
                employeeId: data.employeeId,
                ipAddress: data.ipAddress,
                deviceInfo: data.deviceInfo,
            },
        })
    }

    async findActiveByEmployee(employeeId: number): Promise<UserSession | null> {
        return prisma.userSession.findFirst({
            where: { employeeId, logoutAt: null },
            orderBy: { loginAt: 'desc' },
        })
    }

    async closeSession(id: number, logoutAt: Date): Promise<UserSession> {
        return prisma.userSession.update({
            where: { id },
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
}

export const sessionRepository = new SessionRepository()
