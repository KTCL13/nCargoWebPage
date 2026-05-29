/// <reference types="jest" />

jest.mock('@/lib/prisma', () => ({
    prisma: { auditLog: { create: jest.fn() } },
}))

import { auditLog } from '../audit-logger'
import { prisma } from '@/lib/prisma'

const mocked = <T extends (...args: any) => any>(fn: T) => fn as unknown as jest.Mock

describe('auditLog', () => {
    beforeEach(() => jest.clearAllMocks())

    it('G1 happy path: writes a full entry to the auditLog table', async () => {
        mocked(prisma.auditLog.create).mockResolvedValue({})

        await auditLog({
            entityType: 'Employee',
            entityId: 42,
            action: 'UPDATE',
            performedBy: 1,
            oldValues: { name: 'a' },
            newValues: { name: 'b' },
        })

        expect(prisma.auditLog.create).toHaveBeenCalledWith({
            data: {
                entityType: 'Employee',
                entityId: 42,
                action: 'UPDATE',
                performedBy: 1,
                ipAddress: null,
                oldValues: { name: 'a' },
                newValues: { name: 'b' },
            },
        })
    })

    it('G2 stores null for performedBy when missing', async () => {
        mocked(prisma.auditLog.create).mockResolvedValue({})
        await auditLog({ entityType: 'System', entityId: 1, action: 'BOOT' })
        expect(prisma.auditLog.create).toHaveBeenCalledWith({
            data: expect.objectContaining({ performedBy: null }),
        })
    })

    it('G3 propagates DB failures so callers can react', async () => {
        mocked(prisma.auditLog.create).mockRejectedValue(new Error('DB down'))
        await expect(
            auditLog({ entityType: 'X', entityId: 1, action: 'Y' }),
        ).rejects.toThrow('DB down')
    })
})
