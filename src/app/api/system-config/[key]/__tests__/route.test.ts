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
    prisma: { systemConfig: { upsert: jest.fn() } },
}))

jest.mock('@/lib/auth-guard', () => ({
    requireAdmin: jest.fn(),
}))

import { PATCH } from '../route'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth-guard'

const mocked = <T extends (...args: any) => any>(fn: T) => fn as unknown as jest.Mock

function makeReq(body: unknown): any {
    return {
        url: 'http://localhost/api/system-config/x',
        json: jest.fn().mockResolvedValue(body),
        headers: { get: () => null },
    }
}

beforeEach(() => {
    jest.clearAllMocks()
    mocked(requireAdmin).mockReturnValue({ id: 1, email: 'a@x', role: 'ADMIN' })
})

describe('PATCH /api/system-config/[key]', () => {
    it('G1 admin happy path: upserts the config', async () => {
        mocked(prisma.systemConfig.upsert).mockResolvedValue({ key: 'divisor', value: 150 })
        const res: any = await PATCH(makeReq({ value: 150 }), { params: Promise.resolve({ key: 'divisor' }) })
        expect(res.status).toBe(200)
        expect(prisma.systemConfig.upsert).toHaveBeenCalledWith({
            where: { key: 'divisor' },
            update: { value: 150 },
            create: { key: 'divisor', value: 150 },
        })
    })

    it('G2 missing value → 400', async () => {
        const res: any = await PATCH(makeReq({}), { params: Promise.resolve({ key: 'divisor' }) })
        expect(res.status).toBe(400)
        expect(prisma.systemConfig.upsert).not.toHaveBeenCalled()
    })

    it('G3 non-admin → 401 (mapped via message check)', async () => {
        mocked(requireAdmin).mockImplementationOnce(() => {
            throw new Error('Token no proporcionado')
        })
        const res: any = await PATCH(makeReq({ value: 1 }), { params: Promise.resolve({ key: 'x' }) })
        expect(res.status).toBe(401)
    })
})
