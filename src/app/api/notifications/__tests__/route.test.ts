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
        notification: {
            findMany: jest.fn(),
            count: jest.fn(),
            updateMany: jest.fn(),
            deleteMany: jest.fn(),
        },
    },
}))

jest.mock('@/lib/auth-guard', () => ({
    getAuthEmployee: jest.fn(),
}))

import { GET, PATCH, DELETE } from '../route'
import { prisma } from '@/lib/prisma'
import { getAuthEmployee } from '@/lib/auth-guard'

const mocked = <T extends (...args: any) => any>(fn: T) => fn as unknown as jest.Mock

function makeReq({ url = 'http://localhost/api/notifications', body }: { url?: string; body?: unknown } = {}): any {
    return { url, json: jest.fn().mockResolvedValue(body ?? {}), headers: { get: () => null } }
}

beforeEach(() => {
    jest.clearAllMocks()
    mocked(getAuthEmployee).mockReturnValue({ id: 7, email: 'e@x', role: 'EMPLOYEE' })
})

describe('GET /api/notifications', () => {
    it('G1 happy path: returns notifications scoped to caller', async () => {
        mocked(prisma.notification.findMany).mockResolvedValue([{ id: 1 }])
        const res: any = await GET(makeReq())
        expect(res.status).toBe(200)
        expect(prisma.notification.findMany).toHaveBeenCalledWith(
            expect.objectContaining({ where: { employeeId: 7 } }),
        )
    })

    it('G2 with unread=true: filters by read=false', async () => {
        mocked(prisma.notification.findMany).mockResolvedValue([])
        await GET(makeReq({ url: 'http://localhost/api/notifications?unread=true' }))
        expect(prisma.notification.findMany).toHaveBeenCalledWith(
            expect.objectContaining({ where: { employeeId: 7, read: false } }),
        )
    })

    it('G3 with pageSize > 0: returns paginated response', async () => {
        mocked(prisma.notification.findMany).mockResolvedValue([{ id: 1 }])
        mocked(prisma.notification.count).mockResolvedValue(50)
        const res: any = await GET(makeReq({ url: 'http://localhost/api/notifications?page=2&pageSize=5' }))
        const body = await res.json()
        expect(body).toMatchObject({ total: 50, page: 2, pageSize: 5, totalPages: 10 })
    })

    it('G4 unauthenticated → 401', async () => {
        mocked(getAuthEmployee).mockImplementationOnce(() => {
            throw new Error('Token no proporcionado')
        })
        const res: any = await GET(makeReq())
        expect(res.status).toBe(401)
    })
})

describe('PATCH /api/notifications', () => {
    it('G1 body.all=true: marks all of caller\'s unread as read', async () => {
        mocked(prisma.notification.updateMany).mockResolvedValue({ count: 3 })
        const res: any = await PATCH(makeReq({ body: { all: true } }))
        expect(res.status).toBe(200)
        expect(prisma.notification.updateMany).toHaveBeenCalledWith({
            where: { employeeId: 7, read: false },
            data: { read: true },
        })
    })

    it('G2 body.id provided: marks just that one (scoped to caller)', async () => {
        mocked(prisma.notification.updateMany).mockResolvedValue({ count: 1 })
        await PATCH(makeReq({ body: { id: 42 } }))
        expect(prisma.notification.updateMany).toHaveBeenCalledWith({
            where: { id: 42, employeeId: 7 },
            data: { read: true },
        })
    })

    it('G3 returns 400 on service error', async () => {
        mocked(prisma.notification.updateMany).mockRejectedValue(new Error('DB down'))
        const res: any = await PATCH(makeReq({ body: { all: true } }))
        expect(res.status).toBe(400)
    })
})

describe('DELETE /api/notifications', () => {
    it('G1 happy path: deletes a notification owned by caller', async () => {
        mocked(prisma.notification.deleteMany).mockResolvedValue({ count: 1 })
        const res: any = await DELETE(makeReq({ url: 'http://localhost/api/notifications?id=99' }))
        expect(res.status).toBe(200)
        expect(prisma.notification.deleteMany).toHaveBeenCalledWith({ where: { id: 99, employeeId: 7 } })
    })

    it('G2 missing id → 400', async () => {
        const res: any = await DELETE(makeReq())
        expect(res.status).toBe(400)
    })

    it('G3 attempted access to other user\'s notification just no-ops (zero rows)', async () => {
        // Even if id matches, employeeId scope filters it out
        mocked(prisma.notification.deleteMany).mockResolvedValue({ count: 0 })
        const res: any = await DELETE(makeReq({ url: 'http://localhost/api/notifications?id=99' }))
        expect(res.status).toBe(200)
    })
})
