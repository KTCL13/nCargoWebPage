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

jest.mock('../../services/analytics.service', () => ({
    analyticsService: {
        getEmployeePerformance: jest.fn(),
        getTaskCompletionTimes: jest.fn(),
        getWorkloadDistribution: jest.fn(),
        aggregateKPIs: jest.fn(),
        getAlerts: jest.fn(),
    },
}))

jest.mock('@/lib/auth-guard', () => ({
    requireAdmin: jest.fn(),
    getAuthEmployee: jest.fn(),
}))

import { analyticsController } from '../analytics.controller'
import { analyticsService } from '../../services/analytics.service'
import { requireAdmin } from '@/lib/auth-guard'

const mocked = <T extends (...args: any) => any>(fn: T) => fn as unknown as jest.Mock

function makeReq({ url = 'http://localhost/api/analytics', body }: { url?: string; body?: unknown } = {}): any {
    return {
        url,
        json: jest.fn().mockResolvedValue(body ?? {}),
        headers: { get: () => null },
    }
}

beforeEach(() => {
    jest.clearAllMocks()
    mocked(requireAdmin).mockReturnValue({ id: 1, email: 'admin@x', role: 'ADMIN' })
})

describe('analyticsController.getEmployeePerformance', () => {
    it('G1 happy path: returns 200 with parsed query params', async () => {
        mocked(analyticsService.getEmployeePerformance).mockResolvedValue({ data: [], total: 0 })

        const res: any = await analyticsController.getEmployeePerformance(
            makeReq({ url: 'http://localhost/api/analytics/employee-performance?employeeId=2&from=2026-01-01&to=2026-02-01&page=2&limit=5' }),
        )

        expect(res.status).toBe(200)
        expect(analyticsService.getEmployeePerformance).toHaveBeenCalledWith({
            employeeId: 2,
            from: new Date('2026-01-01'),
            to: new Date('2026-02-01'),
            page: 2,
            limit: 5,
        })
    })

    it('G2 returns 403 when caller is not admin', async () => {
        mocked(requireAdmin).mockImplementationOnce(() => {
            throw new Error('Forbidden: se requiere rol ADMIN')
        })

        const res: any = await analyticsController.getEmployeePerformance(makeReq())
        expect(res.status).toBe(403)
    })

    it('G3 returns 401 when token is missing', async () => {
        mocked(requireAdmin).mockImplementationOnce(() => {
            throw new Error('Token no proporcionado')
        })
        const res: any = await analyticsController.getEmployeePerformance(makeReq())
        expect(res.status).toBe(401)
    })

    it('G4 ignores invalid date params and passes undefined', async () => {
        mocked(analyticsService.getEmployeePerformance).mockResolvedValue({ data: [], total: 0 })

        await analyticsController.getEmployeePerformance(
            makeReq({ url: 'http://localhost/api/analytics/employee-performance?from=not-a-date' }),
        )

        expect(analyticsService.getEmployeePerformance).toHaveBeenCalledWith(
            expect.objectContaining({ from: undefined }),
        )
    })
})

describe('analyticsController.getTaskCompletionTimes', () => {
    it('G1 happy path: forwards filters to service', async () => {
        mocked(analyticsService.getTaskCompletionTimes).mockResolvedValue([])
        const res: any = await analyticsController.getTaskCompletionTimes(
            makeReq({ url: 'http://localhost/api/analytics/task-completion?employeeId=3' }),
        )
        expect(res.status).toBe(200)
        expect(analyticsService.getTaskCompletionTimes).toHaveBeenCalledWith({
            employeeId: 3,
            from: undefined,
            to: undefined,
        })
    })

    it('G2 wraps service error in 400', async () => {
        mocked(analyticsService.getTaskCompletionTimes).mockRejectedValue(new Error('DB down'))
        const res: any = await analyticsController.getTaskCompletionTimes(makeReq())
        expect(res.status).toBe(400)
        await expect(res.json()).resolves.toEqual({ message: 'DB down' })
    })

    it('G3 requires admin', async () => {
        mocked(requireAdmin).mockImplementationOnce(() => {
            throw new Error('Forbidden: se requiere rol ADMIN')
        })
        const res: any = await analyticsController.getTaskCompletionTimes(makeReq())
        expect(res.status).toBe(403)
    })
})

describe('analyticsController.getWorkloadDistribution', () => {
    it('G1 happy path: returns service data', async () => {
        mocked(analyticsService.getWorkloadDistribution).mockResolvedValue([{ employeeId: 1 }])
        const res: any = await analyticsController.getWorkloadDistribution(makeReq())
        expect(res.status).toBe(200)
        await expect(res.json()).resolves.toEqual([{ employeeId: 1 }])
    })

    it('G2 forwards from/to dates when present', async () => {
        mocked(analyticsService.getWorkloadDistribution).mockResolvedValue([])
        await analyticsController.getWorkloadDistribution(
            makeReq({ url: 'http://localhost/api/analytics/workload?from=2026-01-01' }),
        )
        expect(analyticsService.getWorkloadDistribution).toHaveBeenCalledWith({
            from: new Date('2026-01-01'),
            to: undefined,
        })
    })

    it('G3 requires admin', async () => {
        mocked(requireAdmin).mockImplementationOnce(() => {
            throw new Error('Forbidden: se requiere rol ADMIN')
        })
        const res: any = await analyticsController.getWorkloadDistribution(makeReq())
        expect(res.status).toBe(403)
    })
})

describe('analyticsController.aggregateKPIs', () => {
    it('G1 happy path: parses body and returns result', async () => {
        mocked(analyticsService.aggregateKPIs).mockResolvedValue({ created: 5 })
        const res: any = await analyticsController.aggregateKPIs(
            makeReq({ body: { employeeId: '7', from: '2026-01-01', backfill: true } }),
        )
        expect(res.status).toBe(200)
        expect(analyticsService.aggregateKPIs).toHaveBeenCalledWith({
            employeeId: 7,
            from: new Date('2026-01-01'),
            to: undefined,
            backfill: true,
        })
    })

    it('G2 tolerates an empty body (no JSON)', async () => {
        mocked(analyticsService.aggregateKPIs).mockResolvedValue({ created: 0 })
        const req = makeReq()
        req.json = jest.fn().mockRejectedValue(new Error('Empty'))
        const res: any = await analyticsController.aggregateKPIs(req)
        expect(res.status).toBe(200)
        expect(analyticsService.aggregateKPIs).toHaveBeenCalled()
    })

    it('G3 requires admin', async () => {
        mocked(requireAdmin).mockImplementationOnce(() => {
            throw new Error('Forbidden: se requiere rol ADMIN')
        })
        const res: any = await analyticsController.aggregateKPIs(makeReq())
        expect(res.status).toBe(403)
    })
})

describe('analyticsController.getAlerts', () => {
    it('G1 happy path: returns service alerts list', async () => {
        mocked(analyticsService.getAlerts).mockResolvedValue([{ id: 1 }])
        const res: any = await analyticsController.getAlerts(makeReq())
        expect(res.status).toBe(200)
        await expect(res.json()).resolves.toEqual([{ id: 1 }])
    })

    it('G2 wraps service error in 400', async () => {
        mocked(analyticsService.getAlerts).mockRejectedValue(new Error('boom'))
        const res: any = await analyticsController.getAlerts(makeReq())
        expect(res.status).toBe(400)
    })

    it('G3 requires admin', async () => {
        mocked(requireAdmin).mockImplementationOnce(() => {
            throw new Error('Forbidden: se requiere rol ADMIN')
        })
        const res: any = await analyticsController.getAlerts(makeReq())
        expect(res.status).toBe(403)
    })
})
