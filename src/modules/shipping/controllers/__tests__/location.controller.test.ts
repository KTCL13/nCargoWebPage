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

jest.mock('../../services/location.service', () => ({
    locationService: {
        findCountries: jest.fn(),
        findByCountry: jest.fn(),
        createCountry: jest.fn(),
        updateLocation: jest.fn(),
    },
}))

jest.mock('@/lib/auth-guard', () => ({
    getAuthEmployee: jest.fn(),
    requireAdmin: jest.fn(),
}))

import { locationController } from '../location.controller'
import { locationService } from '../../services/location.service'
import { getAuthEmployee, requireAdmin } from '@/lib/auth-guard'

const mocked = <T extends (...args: any) => any>(fn: T) => fn as unknown as jest.Mock

function makeReq({ url = 'http://localhost', body }: { url?: string; body?: unknown } = {}): any {
    return { url, json: jest.fn().mockResolvedValue(body ?? {}), headers: { get: () => null } }
}

beforeEach(() => {
    jest.clearAllMocks()
    mocked(getAuthEmployee).mockReturnValue({ id: 5, email: 'e@x', role: 'EMPLOYEE' })
    mocked(requireAdmin).mockReturnValue({ id: 1, email: 'a@x', role: 'ADMIN' })
})

describe('locationController.findAll', () => {
    it('G1 no country param: returns countries list', async () => {
        mocked(locationService.findCountries).mockResolvedValue([{ id: 1, name: 'Colombia' }])
        const res: any = await locationController.findAll(makeReq())
        expect(res.status).toBe(200)
        expect(locationService.findCountries).toHaveBeenCalled()
    })

    it('G2 with country param: returns cities for that country', async () => {
        mocked(locationService.findByCountry).mockResolvedValue([{ id: 2, name: 'Bogotá' }])
        await locationController.findAll(makeReq({ url: 'http://localhost?country=CO' }))
        expect(locationService.findByCountry).toHaveBeenCalledWith('CO')
    })

    it('G3 token missing → 401', async () => {
        mocked(getAuthEmployee).mockImplementationOnce(() => {
            throw new Error('Token no proporcionado')
        })
        const res: any = await locationController.findAll(makeReq())
        expect(res.status).toBe(401)
    })
})

describe('locationController.create', () => {
    it('G1 happy path: admin creates country → 201', async () => {
        mocked(locationService.createCountry).mockResolvedValue({ id: 1, name: 'X', code: 'XX' })
        const res: any = await locationController.create(makeReq({ body: { name: 'X', code: 'XX' } }))
        expect(res.status).toBe(201)
    })

    it('G2 missing name or code → 400', async () => {
        const res: any = await locationController.create(makeReq({ body: { name: 'X' } }))
        expect(res.status).toBe(400)
        expect(locationService.createCountry).not.toHaveBeenCalled()
    })

    it('G3 non-admin → 403', async () => {
        mocked(requireAdmin).mockImplementationOnce(() => {
            throw new Error('Forbidden: se requiere rol ADMIN')
        })
        const res: any = await locationController.create(makeReq({ body: { name: 'X', code: 'XX' } }))
        expect(res.status).toBe(403)
    })

    it('G4 code too long → 400', async () => {
        const res: any = await locationController.create(
            makeReq({ body: { name: 'X', code: 'TOOLONGCODE12' } }),
        )
        expect(res.status).toBe(400)
    })
})

describe('locationController.update', () => {
    it('G1 happy path: admin updates location', async () => {
        mocked(locationService.updateLocation).mockResolvedValue(undefined)
        const res: any = await locationController.update(makeReq({ body: { name: 'Renamed' } }), 5)
        expect(res.status).toBe(200)
        expect(locationService.updateLocation).toHaveBeenCalledWith(5, 'Renamed')
    })

    it('G2 empty/whitespace name → 400', async () => {
        const res: any = await locationController.update(makeReq({ body: { name: '   ' } }), 5)
        expect(res.status).toBe(400)
    })

    it('G3 non-admin → 403', async () => {
        mocked(requireAdmin).mockImplementationOnce(() => {
            throw new Error('Forbidden: se requiere rol ADMIN')
        })
        const res: any = await locationController.update(makeReq({ body: { name: 'X' } }), 5)
        expect(res.status).toBe(403)
    })
})
