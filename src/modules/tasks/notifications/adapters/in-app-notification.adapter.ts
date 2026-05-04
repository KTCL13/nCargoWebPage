import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'

class InAppNotificationAdapter {
    async notifyEmployee(
        employeeId: number,
        type: string,
        message: string,
        metadata?: Record<string, unknown>,
    ): Promise<void> {
        await prisma.notification.create({
            data: {
                employeeId,
                type,
                message,
                metadata: (metadata ?? {}) as Prisma.InputJsonValue,
            },
        })
    }
}

export const inAppNotificationAdapter = new InAppNotificationAdapter()
