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

jest.mock('../../services/shipping-provider.service', () => ({
    shippingProviderService: {
        findAll: jest.fn(),
        getRates: jest.fn(),
        createRate: jest.fn(),
        updateRate: jest.fn(),
        deleteRate: jest.fn(),
    },
}))

jest.mock('@/lib/auth-guard', () => ({
    getAuthEmployee: jest.fn(),
    requireAdmin: jest.fn(),
}))

import { shippingProviderController } from '../shipping-provider.controller'
import { shippingProviderService } from '../../services/shipping-provider.service'
import { getAuthEmployee, requireAdmin } from '@/lib/auth-guard'

const mocked = <T extends (...args: any) => any>(fn: T) => fn as unknown as jest.Mock

function makeReq({ body }: { body?: unknown } = {}): any {
    return { url: 'http://localhost', json: jest.fn().mockResolvedValue(body ?? {}), headers: { get: () => null } }
}

beforeEach(() => {
    jest.clearAllMocks()
    mocked(getAuthEmployee).mockReturnValue({ id: 5, email: 'e@x', role: 'EMPLOYEE' })
    mocked(requireAdmin).mockReturnValue({ id: 1, email: 'a@x', role: 'ADMIN' })
})

describe('shippingProviderController.findAll', () => {
    it('G1 happy path: returns providers list with total', async () => {
        mocked(shippingProviderService.findAll).mockResolvedValue([{ id: 1 }, { id: 2 }])
        const res: any = await shippingProviderController.findAll(makeReq())
        expect(res.status).toBe(200)
        await expect(res.json()).resolves.toEqual({ data: [{ id: 1 }, { id: 2 }], total: 2 })
    })

    it('G2 returns 401 when token missing', async () => {
        mocked(getAuthEmployee).mockImplementationOnce(() => {
            throw new Error('Token no proporcionado')
        })
        const res: any = await shippingProviderController.findAll(makeReq())
        expect(res.status).toBe(401)
    })
})

describe('shippingProviderController.getRates', () => {
    it('G1 happy path: returns rates list with total', async () => {
        mocked(shippingProviderService.getRates).mockResolvedValue([{ id: 1, basePrice: 10 }])
        const res: any = await shippingProviderController.getRates(makeReq(), 7)
        expect(res.status).toBe(200)
        expect(shippingProviderService.getRates).toHaveBeenCalledWith(7)
    })
})

describe('shippingProviderController.createRate', () => {
    it('G1 happy path: returns 201 with new rate', async () => {
        mocked(shippingProviderService.createRate).mockResolvedValue({ id: 99 })
        const res: any = await shippingProviderController.createRate(
            makeReq({ body: { destinationId: 1, basePrice: 50 } }),
            7,
        )
        expect(res.status).toBe(201)
    })

    it('G2 returns 400 when destinationId or basePrice is missing', async () => {
        const res: any = await shippingProviderController.createRate(
            makeReq({ body: { destinationId: 1 } }),
            7,
        )
        expect(res.status).toBe(400)
        expect(shippingProviderService.createRate).not.toHaveBeenCalled()
    })

    it('G3 returns 403 when caller is not admin', async () => {
        mocked(requireAdmin).mockImplementationOnce(() => {
            throw new Error('Forbidden: se requiere rol ADMIN')
        })
        const res: any = await shippingProviderController.createRate(
            makeReq({ body: { destinationId: 1, basePrice: 50 } }),
            7,
        )
        expect(res.status).toBe(403)
    })
})

describe('shippingProviderController.updateRate', () => {
    it('G1 happy path: returns 200 with updated rate', async () => {
        mocked(shippingProviderService.updateRate).mockResolvedValue({ id: 99, basePrice: 60 })
        const res: any = await shippingProviderController.updateRate(makeReq({ body: { basePrice: 60 } }), 7, 99)
        expect(res.status).toBe(200)
    })

    it('G2 non-admin → 403', async () => {
        mocked(requireAdmin).mockImplementationOnce(() => {
            throw new Error('Forbidden: se requiere rol ADMIN')
        })
        const res: any = await shippingProviderController.updateRate(makeReq({ body: {} }), 7, 99)
        expect(res.status).toBe(403)
    })

    it('G3 service throws not-found → 404', async () => {
        mocked(shippingProviderService.updateRate).mockRejectedValue(new Error('Rate not found'))
        const res: any = await shippingProviderController.updateRate(makeReq({ body: {} }), 7, 99)
        expect(res.status).toBe(404)
    })
})

describe('shippingProviderController.deleteRate', () => {
    it('G1 happy path: returns 204', async () => {
        mocked(shippingProviderService.deleteRate).mockResolvedValue(undefined)
        const res: any = await shippingProviderController.deleteRate(makeReq(), 7, 99)
        expect(res.status).toBe(204)
    })

    it('G2 non-admin → 403', async () => {
        mocked(requireAdmin).mockImplementationOnce(() => {
            throw new Error('Forbidden: se requiere rol ADMIN')
        })
        const res: any = await shippingProviderController.deleteRate(makeReq(), 7, 99)
        expect(res.status).toBe(403)
    })
})
