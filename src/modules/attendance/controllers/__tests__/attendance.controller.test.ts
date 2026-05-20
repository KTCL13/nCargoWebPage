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

jest.mock('../../services/attendance.service', () => ({
    attendanceService: {
        clockIn: jest.fn(),
        clockOut: jest.fn(),
        pause: jest.fn(),
        resume: jest.fn(),
        getToday: jest.fn(),
        getHistory: jest.fn(),
    },
}))

jest.mock('@/lib/auth-guard', () => ({
    getAuthEmployee: jest.fn(),
}))

jest.mock('@/lib/get-ip', () => ({
    getIp: jest.fn(() => '1.2.3.4'),
}))

import { attendanceController } from '../attendance.controller'
import { attendanceService } from '../../services/attendance.service'
import { getAuthEmployee } from '@/lib/auth-guard'

const mocked = <T extends (...args: any) => any>(fn: T) => fn as unknown as jest.Mock

function makeReq({ url = 'http://localhost/api/attendance', body }: { url?: string; body?: unknown } = {}): any {
    return {
        url,
        json: jest.fn().mockResolvedValue(body ?? {}),
        headers: { get: () => null },
    }
}

beforeEach(() => {
    jest.clearAllMocks()
    mocked(getAuthEmployee).mockReturnValue({ id: 7, email: 'e@x.c', role: 'EMPLOYEE' })
})

describe('attendanceController.clockIn', () => {
    it('G1 happy path: returns 201 with new attendance', async () => {
        mocked(attendanceService.clockIn).mockResolvedValue({ id: 1, events: [] })
        const res: any = await attendanceController.clockIn(makeReq())
        expect(res.status).toBe(201)
        expect(attendanceService.clockIn).toHaveBeenCalledWith(7, '1.2.3.4')
    })

    it('G2 returns 401 on missing token', async () => {
        mocked(getAuthEmployee).mockImplementationOnce(() => {
            throw new Error('Token no proporcionado')
        })
        const res: any = await attendanceController.clockIn(makeReq())
        expect(res.status).toBe(401)
    })

    it('G3 returns 400 on business error (already clocked in)', async () => {
        mocked(attendanceService.clockIn).mockRejectedValue(new Error('El empleado ya tiene una asistencia activa hoy'))
        const res: any = await attendanceController.clockIn(makeReq())
        expect(res.status).toBe(400)
    })

    it('G4 returns 403 when service throws an IP mismatch error', async () => {
        mocked(attendanceService.clockIn).mockRejectedValue(new Error('La IP no coincide con la de clock-in'))
        const res: any = await attendanceController.clockIn(makeReq())
        expect(res.status).toBe(403)
    })
})

describe('attendanceController.pause / resume / clockOut', () => {
    it.each(['pause', 'resume', 'clockOut'] as const)('%s G1 happy path: returns 200', async (method) => {
        ;(mocked as any)((attendanceService as any)[method]).mockResolvedValue({ id: 1 })
        const res: any = await (attendanceController as any)[method](makeReq())
        expect(res.status).toBe(200)
        expect((attendanceService as any)[method]).toHaveBeenCalledWith(7, '1.2.3.4')
    })

    it.each(['pause', 'resume', 'clockOut'] as const)('%s G2 propagates business 400', async (method) => {
        ;(mocked as any)((attendanceService as any)[method]).mockRejectedValue(new Error('No hay sesión activa'))
        const res: any = await (attendanceController as any)[method](makeReq())
        expect(res.status).toBe(400)
    })
})

describe('attendanceController.getToday', () => {
    it('G1 happy path: scopes to authenticated employee by default', async () => {
        mocked(attendanceService.getToday).mockResolvedValue({ id: 1 })
        const res: any = await attendanceController.getToday(makeReq())
        expect(res.status).toBe(200)
        expect(attendanceService.getToday).toHaveBeenCalledWith(7)
    })

    it('G2 admin can query any employeeId', async () => {
        mocked(getAuthEmployee).mockReturnValueOnce({ id: 1, email: 'a@x', role: 'ADMIN' })
        mocked(attendanceService.getToday).mockResolvedValue(null)
        await attendanceController.getToday(makeReq({ url: 'http://localhost/api/attendance/today?employeeId=42' }))
        expect(attendanceService.getToday).toHaveBeenCalledWith(42)
    })

    it('G3 non-admin trying to query other employee → 403', async () => {
        const res: any = await attendanceController.getToday(
            makeReq({ url: 'http://localhost/api/attendance/today?employeeId=99' }),
        )
        expect(res.status).toBe(403)
        expect(attendanceService.getToday).not.toHaveBeenCalled()
    })

    it('G4 returns 200 with null when service has no record', async () => {
        mocked(attendanceService.getToday).mockResolvedValue(null)
        const res: any = await attendanceController.getToday(makeReq())
        expect(res.status).toBe(200)
        await expect(res.json()).resolves.toBeNull()
    })
})

describe('attendanceController.getHistory', () => {
    it('G1 happy path: returns paginated history scoped to caller', async () => {
        mocked(attendanceService.getHistory).mockResolvedValue({ data: [], total: 0 })
        const res: any = await attendanceController.getHistory(
            makeReq({ url: 'http://localhost/api/attendance/history?page=2&limit=5' }),
        )
        expect(res.status).toBe(200)
        expect(attendanceService.getHistory).toHaveBeenCalledWith(7, 2, 5)
    })

    it('G2 non-admin asking for other employee → 403', async () => {
        const res: any = await attendanceController.getHistory(
            makeReq({ url: 'http://localhost/api/attendance/history?employeeId=99' }),
        )
        expect(res.status).toBe(403)
    })

    it('G3 admin can query other employee history', async () => {
        mocked(getAuthEmployee).mockReturnValueOnce({ id: 1, email: 'a', role: 'ADMIN' })
        mocked(attendanceService.getHistory).mockResolvedValue({ data: [], total: 0 })
        await attendanceController.getHistory(
            makeReq({ url: 'http://localhost/api/attendance/history?employeeId=42&page=1&limit=10' }),
        )
        expect(attendanceService.getHistory).toHaveBeenCalledWith(42, 1, 10)
    })
})
