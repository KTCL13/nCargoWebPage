import { prisma } from '@/lib/prisma'
import { InputJsonValue } from '@prisma/client/runtime/library'

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
                metadata: (metadata ?? {}) as InputJsonValue,
            },
        })
    }
}

export const inAppNotificationAdapter = new InAppNotificationAdapter()
