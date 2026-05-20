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

jest.mock('@/modules/attendance/services/attendance.service', () => ({
    attendanceService: { closeAllStaleSessions: jest.fn() },
}))

import { POST } from '../route'
import { attendanceService } from '@/modules/attendance/services/attendance.service'

const mocked = <T extends (...args: any) => any>(fn: T) => fn as unknown as jest.Mock

function makeReq(headers: Record<string, string> = {}): any {
    return {
        url: 'http://localhost/api/cron/close-stale-attendance',
        headers: { get: (k: string) => headers[k.toLowerCase()] ?? null },
    }
}

beforeEach(() => {
    jest.clearAllMocks()
    delete process.env.CRON_SECRET
})

describe('POST /api/cron/close-stale-attendance', () => {
    it('G1 happy path with x-vercel-cron header → 200', async () => {
        mocked(attendanceService.closeAllStaleSessions).mockResolvedValue({ closed: 3 })
        const res: any = await POST(makeReq({ 'x-vercel-cron': '1' }))
        expect(res.status).toBe(200)
        await expect(res.json()).resolves.toEqual({ ok: true, closed: 3 })
    })

    it('G2 happy path with valid Bearer CRON_SECRET → 200', async () => {
        process.env.CRON_SECRET = 's3cret-token'
        mocked(attendanceService.closeAllStaleSessions).mockResolvedValue({ closed: 1 })
        const res: any = await POST(makeReq({ authorization: 'Bearer s3cret-token' }))
        expect(res.status).toBe(200)
    })

    it('G3 missing auth → 401', async () => {
        const res: any = await POST(makeReq())
        expect(res.status).toBe(401)
        expect(attendanceService.closeAllStaleSessions).not.toHaveBeenCalled()
    })

    it('G4 wrong Bearer token → 401', async () => {
        process.env.CRON_SECRET = 's3cret-token'
        const res: any = await POST(makeReq({ authorization: 'Bearer wrong' }))
        expect(res.status).toBe(401)
    })

    it('G5 CRON_SECRET unset and no Vercel header → 401 (no auth bypass)', async () => {
        const res: any = await POST(makeReq({ authorization: 'Bearer anything' }))
        expect(res.status).toBe(401)
    })

    it('G6 service throws → 500', async () => {
        mocked(attendanceService.closeAllStaleSessions).mockRejectedValue(new Error('DB down'))
        const res: any = await POST(makeReq({ 'x-vercel-cron': '1' }))
        expect(res.status).toBe(500)
    })
})
