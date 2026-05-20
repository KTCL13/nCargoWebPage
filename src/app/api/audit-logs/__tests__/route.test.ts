/// <reference types="jest" />

jest.mock('next/server', () => {
    class NextResponse extends Response {
        static json(body: unknown, init?: { status?: number }) {
            return new NextResponse(JSON.stringify(body), {
                status: init?.status ?? 200,
                headers: { 'content-type': 'application/json' },
            })
        }
    }
    class NextRequest {}
    return { NextResponse, NextRequest }
})

jest.mock('@/lib/prisma', () => ({
    prisma: {
        auditLog: { findMany: jest.fn(), count: jest.fn() },
    },
}))

jest.mock('@/lib/auth-guard', () => ({
    requireAdmin: jest.fn(),
}))

import { GET } from '../route'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth-guard'

const mocked = <T extends (...args: any) => any>(fn: T) => fn as unknown as jest.Mock

function makeReq({ url = 'http://localhost/api/audit-logs' }: { url?: string } = {}): any {
    return { url, headers: { get: () => null } }
}

beforeEach(() => {
    jest.clearAllMocks()
    mocked(requireAdmin).mockReturnValue({ id: 1, email: 'a@x', role: 'ADMIN' })
})

describe('GET /api/audit-logs', () => {
    it('G1 admin happy path: returns all logs newest first', async () => {
        mocked(prisma.auditLog.findMany).mockResolvedValue([{ id: 2 }, { id: 1 }])
        const res: any = await GET(makeReq())
        expect(res.status).toBe(200)
        expect(prisma.auditLog.findMany).toHaveBeenCalledWith(
            expect.objectContaining({ where: {}, orderBy: { createdAt: 'desc' } }),
        )
    })

    it('G2 with pageSize > 0: returns paginated response', async () => {
        mocked(prisma.auditLog.findMany).mockResolvedValue([{ id: 1 }])
        mocked(prisma.auditLog.count).mockResolvedValue(25)
        const res: any = await GET(makeReq({ url: 'http://localhost/api/audit-logs?page=1&pageSize=10' }))
        const body = await res.json()
        expect(body).toMatchObject({ total: 25, page: 1, pageSize: 10, totalPages: 3 })
    })

    it('G3 with entity filter', async () => {
        mocked(prisma.auditLog.findMany).mockResolvedValue([])
        await GET(makeReq({ url: 'http://localhost/api/audit-logs?entity=Employee' }))
        expect(prisma.auditLog.findMany).toHaveBeenCalledWith(
            expect.objectContaining({ where: { entityType: 'Employee' } }),
        )
    })

    it('G4 non-admin → 403', async () => {
        mocked(requireAdmin).mockImplementationOnce(() => {
            throw new Error('Forbidden: se requiere rol ADMIN')
        })
        const res: any = await GET(makeReq())
        expect(res.status).toBe(403)
        expect(prisma.auditLog.findMany).not.toHaveBeenCalled()
    })

    it('G5 missing token → 401', async () => {
        mocked(requireAdmin).mockImplementationOnce(() => {
            throw new Error('Token no proporcionado')
        })
        const res: any = await GET(makeReq())
        expect(res.status).toBe(401)
    })
})
