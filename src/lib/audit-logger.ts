import { prisma } from '@/lib/prisma'

type AuditLogParams = {
    entityType: string
    entityId: number
    action: string
    performedBy?: number | null
    oldValues?: object
    newValues?: object
}

export async function auditLog(params: AuditLogParams): Promise<void> {
    await prisma.auditLog.create({
        data: {
            entityType: params.entityType,
            entityId: params.entityId,
            action: params.action,
            performedBy: params.performedBy ?? null,
            oldValues: params.oldValues ?? undefined,
            newValues: params.newValues ?? undefined,
        },
    })
}
