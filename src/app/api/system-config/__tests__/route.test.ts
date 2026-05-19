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
        systemConfig: { findMany: jest.fn(), upsert: jest.fn() },
    },
}))

jest.mock('@/lib/auth-guard', () => ({
    requireAdmin: jest.fn(),
}))

import { GET, PUT } from '../route'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth-guard'

const mocked = <T extends (...args: any) => any>(fn: T) => fn as unknown as jest.Mock

function makeReq({ body }: { body?: unknown } = {}): any {
    return {
        url: 'http://localhost/api/system-config',
        json: jest.fn().mockResolvedValue(body ?? {}),
        headers: { get: () => null },
    }
}

beforeEach(() => {
    jest.clearAllMocks()
    mocked(requireAdmin).mockReturnValue({ id: 1, email: 'a@x', role: 'ADMIN' })
})

describe('GET /api/system-config', () => {
    it('G1 admin happy path: returns all configs ordered by key', async () => {
        mocked(prisma.systemConfig.findMany).mockResolvedValue([{ key: 'a', value: 1 }, { key: 'b', value: 2 }])
        const res: any = await GET(makeReq())
        expect(res.status).toBe(200)
        await expect(res.json()).resolves.toEqual({
            data: [{ key: 'a', value: 1 }, { key: 'b', value: 2 }],
            total: 2,
        })
    })

    it('G2 non-admin → 403', async () => {
        mocked(requireAdmin).mockImplementationOnce(() => {
            throw new Error('Forbidden: se requiere rol ADMIN')
        })
        const res: any = await GET(makeReq())
        expect(res.status).toBe(403)
        expect(prisma.systemConfig.findMany).not.toHaveBeenCalled()
    })

    it('G3 no token → 401', async () => {
        mocked(requireAdmin).mockImplementationOnce(() => {
            throw new Error('Token no proporcionado')
        })
        const res: any = await GET(makeReq())
        expect(res.status).toBe(401)
    })
})

describe('PUT /api/system-config', () => {
    it('G1 admin happy path: upserts every entry of the array', async () => {
        mocked(prisma.systemConfig.upsert).mockResolvedValue({})
        const res: any = await PUT(makeReq({
            body: [
                { key: 'divisor', value: 150 },
                { key: 'insurance_rate', value: 0.12 },
            ],
        }))
        expect(res.status).toBe(200)
        expect(prisma.systemConfig.upsert).toHaveBeenCalledTimes(2)
    })

    it('G2 rejects non-array body with 400', async () => {
        const res: any = await PUT(makeReq({ body: { key: 'x', value: 'y' } }))
        expect(res.status).toBe(400)
        expect(prisma.systemConfig.upsert).not.toHaveBeenCalled()
    })

    it('G3 non-admin → 403', async () => {
        mocked(requireAdmin).mockImplementationOnce(() => {
            throw new Error('Forbidden: se requiere rol ADMIN')
        })
        const res: any = await PUT(makeReq({ body: [] }))
        expect(res.status).toBe(403)
    })

    it('G4 returns 500 when an upsert fails', async () => {
        mocked(prisma.systemConfig.upsert).mockRejectedValue(new Error('DB error'))
        const res: any = await PUT(makeReq({ body: [{ key: 'x', value: 1 }] }))
        expect(res.status).toBe(500)
    })
})
