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

jest.mock('../../services/cotizacion-calculator.service', () => ({
    cotizacionCalculatorService: {
        calculate: jest.fn(),
        getCiudades: jest.fn(),
    },
}))

import { cotizacionesController } from '../cotizaciones.controller'
import { cotizacionCalculatorService } from '../../services/cotizacion-calculator.service'

const mocked = <T extends (...args: any) => any>(fn: T) => fn as unknown as jest.Mock

function makeReq({ url = 'http://localhost/api/cotizaciones', body }: { url?: string; body?: unknown } = {}): any {
    return { url, json: jest.fn().mockResolvedValue(body ?? {}), headers: { get: () => null } }
}

beforeEach(() => jest.clearAllMocks())

describe('cotizacionesController.calcular', () => {
    const validBody = {
        country: 'CO',
        actualWeightLb: 10,
        heightIn: 5,
        lengthIn: 5,
        widthIn: 5,
        declaredValueUsd: 50,
    }

    it('G1 happy path: returns 200 with breakdown', async () => {
        mocked(cotizacionCalculatorService.calculate).mockResolvedValue({ total: 100 })
        const res: any = await cotizacionesController.calcular(makeReq({ body: validBody }))
        expect(res.status).toBe(200)
        await expect(res.json()).resolves.toEqual({ total: 100 })
    })

    it('G2 returns 400 when required fields are missing', async () => {
        const res: any = await cotizacionesController.calcular(makeReq({ body: { country: 'CO' } }))
        expect(res.status).toBe(400)
        expect(cotizacionCalculatorService.calculate).not.toHaveBeenCalled()
    })

    it('G3 rejects invalid country code', async () => {
        const res: any = await cotizacionesController.calcular(
            makeReq({ body: { ...validBody, country: 'AR' } }),
        )
        expect(res.status).toBe(400)
        await expect(res.json()).resolves.toEqual({ message: 'Selecciona un país de destino: Colombia (CO) o México (MX)' })
    })

    it('G4 wraps service errors in 400', async () => {
        mocked(cotizacionCalculatorService.calculate).mockRejectedValue(new Error('Peso fuera de rango'))
        const res: any = await cotizacionesController.calcular(makeReq({ body: validBody }))
        expect(res.status).toBe(400)
    })

    it('G5 normalizes country to uppercase before delegating', async () => {
        mocked(cotizacionCalculatorService.calculate).mockResolvedValue({})
        await cotizacionesController.calcular(makeReq({ body: { ...validBody, country: 'co' } }))
        expect(cotizacionCalculatorService.calculate).toHaveBeenCalledWith(
            expect.objectContaining({ country: 'CO' }),
        )
    })
})

describe('cotizacionesController.ciudades', () => {
    it('G1 happy path: returns cities for valid country', async () => {
        mocked(cotizacionCalculatorService.getCiudades).mockResolvedValue({ data: [] })
        const res: any = await cotizacionesController.ciudades(
            makeReq({ url: 'http://localhost/api/cotizaciones/ciudades?country=CO' }),
        )
        expect(res.status).toBe(200)
    })

    it('G2 rejects invalid country', async () => {
        const res: any = await cotizacionesController.ciudades(
            makeReq({ url: 'http://localhost/api/cotizaciones/ciudades?country=AR' }),
        )
        expect(res.status).toBe(400)
    })

    it('G3 returns 500 on service error', async () => {
        mocked(cotizacionCalculatorService.getCiudades).mockRejectedValue(new Error('DB down'))
        const res: any = await cotizacionesController.ciudades(
            makeReq({ url: 'http://localhost/api/cotizaciones/ciudades?country=CO' }),
        )
        expect(res.status).toBe(500)
    })
})
