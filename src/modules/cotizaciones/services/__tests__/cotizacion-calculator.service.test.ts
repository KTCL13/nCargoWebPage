/// <reference types="jest" />

jest.mock('@/lib/prisma', () => ({
    prisma: {
        systemConfig: { findMany: jest.fn() },
        shippingRate: { findFirst: jest.fn(), findMany: jest.fn() },
        quotation: { create: jest.fn() },
        cotizacionRecord: { create: jest.fn() },
    },
}))

import { cotizacionCalculatorService } from '../cotizacion-calculator.service'
import { prisma } from '@/lib/prisma'

const mocked = <T extends (...args: any) => any>(fn: T) => fn as unknown as jest.Mock

function configRows(overrides: Partial<Record<string, number | boolean>> = {}) {
    const defaults: Record<string, number | boolean> = {
        divisor: 153,
        insurance_rate: 0.1,
        customs_rate: 0.31,
        customs_threshold: 200,
        pickup_base: 10,
        pickup_per_extra_mile: 2,
        pickup_free_miles: 8,
        co_flat_rate_enabled: false,
        co_flat_rate_price: 0,
        mx_flat_rate_enabled: false,
        mx_flat_rate_price: 0,
    }
    const merged = { ...defaults, ...overrides }
    return Object.entries(merged).map(([key, value]) => ({ key, value }))
}

beforeEach(() => {
    jest.clearAllMocks()
    mocked(prisma.quotation.create).mockResolvedValue({ id: 1 })
    mocked(prisma.cotizacionRecord.create).mockResolvedValue({ id: 1 })
})

describe('cotizacionCalculatorService.calculate — transport rate brackets', () => {
    it('G1 ≤14 lb: flat $36 transport', async () => {
        mocked(prisma.systemConfig.findMany).mockResolvedValue(configRows({ co_flat_rate_enabled: true, co_flat_rate_price: 5 }))

        const r = await cotizacionCalculatorService.calculate({
            country: 'CO' as const,
            actualWeightLb: 10,
            heightIn: 1, lengthIn: 1, widthIn: 1,
            declaredValueUsd: 0,
        })

        expect(r.transport).toBe(36)
    })

    it('G2 15–70 lb: $2.95 per lb rounded up', async () => {
        mocked(prisma.systemConfig.findMany).mockResolvedValue(configRows({ co_flat_rate_enabled: true, co_flat_rate_price: 5 }))
        const r = await cotizacionCalculatorService.calculate({
            country: 'CO' as const,
            actualWeightLb: 20,
            heightIn: 1, lengthIn: 1, widthIn: 1,
            declaredValueUsd: 0,
        })
        expect(r.transport).toBe(Math.ceil(20 * 2.95))
    })

    it('G3 71–110 lb: $3.15 per lb rounded up', async () => {
        mocked(prisma.systemConfig.findMany).mockResolvedValue(configRows({ co_flat_rate_enabled: true, co_flat_rate_price: 5 }))
        const r = await cotizacionCalculatorService.calculate({
            country: 'CO' as const,
            actualWeightLb: 100,
            heightIn: 1, lengthIn: 1, widthIn: 1,
            declaredValueUsd: 0,
        })
        expect(r.transport).toBe(Math.ceil(100 * 3.15))
    })

    it('G4 >110 lb: throws out-of-range', async () => {
        mocked(prisma.systemConfig.findMany).mockResolvedValue(configRows({ co_flat_rate_enabled: true, co_flat_rate_price: 5 }))
        await expect(
            cotizacionCalculatorService.calculate({
                country: 'CO' as const,
                actualWeightLb: 150,
                heightIn: 1, lengthIn: 1, widthIn: 1,
                declaredValueUsd: 0,
            }),
        ).rejects.toThrow(/fuera de rango/)
    })
})

describe('cotizacionCalculatorService.calculate — customs threshold', () => {
    it('G1 declared > threshold: applies customs at configured rate', async () => {
        mocked(prisma.systemConfig.findMany).mockResolvedValue(configRows({
            customs_threshold: 100,
            customs_rate: 0.5,
            co_flat_rate_enabled: true,
            co_flat_rate_price: 5,
        }))
        const r = await cotizacionCalculatorService.calculate({
            country: 'CO' as const,
            actualWeightLb: 5,
            heightIn: 1, lengthIn: 1, widthIn: 1,
            declaredValueUsd: 150,
        })
        expect(r.customs).toBe(Math.ceil(150 * 0.5))
    })

    it('G2 declared ≤ threshold: customs is 0', async () => {
        mocked(prisma.systemConfig.findMany).mockResolvedValue(configRows({
            customs_threshold: 200,
            co_flat_rate_enabled: true,
            co_flat_rate_price: 5,
        }))
        const r = await cotizacionCalculatorService.calculate({
            country: 'CO' as const,
            actualWeightLb: 5,
            heightIn: 1, lengthIn: 1, widthIn: 1,
            declaredValueUsd: 150,
        })
        expect(r.customs).toBe(0)
    })

    it('G3 declared > MAX_DECLARED_VALUE_USD (200): throws before any DB work', async () => {
        await expect(
            cotizacionCalculatorService.calculate({
                country: 'CO' as const,
                actualWeightLb: 5,
                heightIn: 1, lengthIn: 1, widthIn: 1,
                declaredValueUsd: 250,
            }),
        ).rejects.toThrow(/200 USD/)
        expect(prisma.systemConfig.findMany).not.toHaveBeenCalled()
    })
})

describe('cotizacionCalculatorService.calculate — volumetric surcharge', () => {
    it('G1 volumetric > actual: surcharge equals the difference', async () => {
        // box 153 in³ at divisor 153 → volumetric weight = 1; actual 0.1 → surcharge = 1 - 0.1 (rounded actual stays as given)
        mocked(prisma.systemConfig.findMany).mockResolvedValue(configRows({ co_flat_rate_enabled: true, co_flat_rate_price: 5 }))
        const r = await cotizacionCalculatorService.calculate({
            country: 'CO' as const,
            actualWeightLb: 1,
            heightIn: 10, lengthIn: 10, widthIn: 10, // 1000 / 153 = 6.53 → 7 volumetric
            declaredValueUsd: 0,
        })
        expect(r.volumetricSurcharge).toBe(7 - 1)
    })

    it('G2 volumetric ≤ actual: surcharge is 0', async () => {
        mocked(prisma.systemConfig.findMany).mockResolvedValue(configRows({ co_flat_rate_enabled: true, co_flat_rate_price: 5 }))
        const r = await cotizacionCalculatorService.calculate({
            country: 'CO' as const,
            actualWeightLb: 50,
            heightIn: 1, lengthIn: 1, widthIn: 1,
            declaredValueUsd: 0,
        })
        expect(r.volumetricSurcharge).toBe(0)
    })
})

describe('cotizacionCalculatorService.calculate — flat rate vs city lookup', () => {
    it('G1 flat enabled: uses configured flat price and skips DB lookup', async () => {
        mocked(prisma.systemConfig.findMany).mockResolvedValue(configRows({
            co_flat_rate_enabled: true,
            co_flat_rate_price: 25,
        }))

        const r = await cotizacionCalculatorService.calculate({
            country: 'CO' as const,
            actualWeightLb: 1,
            heightIn: 1, lengthIn: 1, widthIn: 1,
            declaredValueUsd: 0,
        })

        expect(r.cityDelivery).toBe(25)
        expect(r.detail.flatRateApplied).toBe(true)
        expect(prisma.shippingRate.findFirst).not.toHaveBeenCalled()
    })

    it('G2 flat disabled without destinationCityId: throws', async () => {
        mocked(prisma.systemConfig.findMany).mockResolvedValue(configRows())
        await expect(
            cotizacionCalculatorService.calculate({
                country: 'CO' as const,
                actualWeightLb: 1,
                heightIn: 1, lengthIn: 1, widthIn: 1,
                declaredValueUsd: 0,
            }),
        ).rejects.toThrow(/destinationCityId/)
    })

    it('G3 flat disabled with cityId not in DB: throws', async () => {
        mocked(prisma.systemConfig.findMany).mockResolvedValue(configRows())
        mocked(prisma.shippingRate.findFirst).mockResolvedValue(null)
        await expect(
            cotizacionCalculatorService.calculate({
                country: 'CO' as const,
                actualWeightLb: 1,
                heightIn: 1, lengthIn: 1, widthIn: 1,
                declaredValueUsd: 0,
                destinationCityId: 99,
            }),
        ).rejects.toThrow(/No se encontró tarifa/)
    })

    it('G4 flat disabled with valid city: pulls price from DB', async () => {
        mocked(prisma.systemConfig.findMany).mockResolvedValue(configRows())
        mocked(prisma.shippingRate.findFirst).mockResolvedValue({
            price: 40,
            location: { name: 'Medellín' },
        } as any)

        const r = await cotizacionCalculatorService.calculate({
            country: 'CO' as const,
            actualWeightLb: 1,
            heightIn: 1, lengthIn: 1, widthIn: 1,
            declaredValueUsd: 0,
            destinationCityId: 12,
        })

        expect(r.cityDelivery).toBe(40)
        expect(r.detail.cityName).toBe('Medellín')
    })
})

describe('cotizacionCalculatorService.calculate — pickup', () => {
    it('G1 miles=0 → pickup=0', async () => {
        mocked(prisma.systemConfig.findMany).mockResolvedValue(configRows({ co_flat_rate_enabled: true, co_flat_rate_price: 5 }))
        const r = await cotizacionCalculatorService.calculate({
            country: 'CO' as const,
            actualWeightLb: 1,
            heightIn: 1, lengthIn: 1, widthIn: 1,
            declaredValueUsd: 0,
            pickupMiles: 0,
        })
        expect(r.pickup).toBe(0)
    })

    it('G2 within free miles: base only', async () => {
        mocked(prisma.systemConfig.findMany).mockResolvedValue(configRows({ co_flat_rate_enabled: true, co_flat_rate_price: 5 }))
        const r = await cotizacionCalculatorService.calculate({
            country: 'CO' as const,
            actualWeightLb: 1,
            heightIn: 1, lengthIn: 1, widthIn: 1,
            declaredValueUsd: 0,
            pickupMiles: 5,
        })
        expect(r.pickup).toBe(10)
    })

    it('G3 over free miles: base + per-mile surcharge', async () => {
        mocked(prisma.systemConfig.findMany).mockResolvedValue(configRows({ co_flat_rate_enabled: true, co_flat_rate_price: 5 }))
        const r = await cotizacionCalculatorService.calculate({
            country: 'CO' as const,
            actualWeightLb: 1,
            heightIn: 1, lengthIn: 1, widthIn: 1,
            declaredValueUsd: 0,
            pickupMiles: 12, // 8 free + 4 extra * 2 = 8
        })
        expect(r.pickup).toBe(10 + (12 - 8) * 2)
    })
})

describe('cotizacionCalculatorService.getCiudades', () => {
    it('G1 flat enabled: returns flatRateEnabled:true with empty data list', async () => {
        mocked(prisma.systemConfig.findMany).mockResolvedValue(configRows({
            co_flat_rate_enabled: true,
            co_flat_rate_price: 25,
        }))
        const r: any = await cotizacionCalculatorService.getCiudades('CO')
        expect(r.flatRateEnabled).toBe(true)
        expect(r.flatRatePrice).toBe(25)
        expect(r.data).toEqual([])
    })

    it('G2 flat disabled: returns deduplicated list of cities from DB', async () => {
        mocked(prisma.systemConfig.findMany).mockResolvedValue(configRows())
        mocked(prisma.shippingRate.findMany).mockResolvedValue([
            { price: 30, location: { id: 1, name: 'Bogotá', parent: { name: 'Cundinamarca' } } },
            { price: 35, location: { id: 2, name: 'Medellín', parent: { name: 'Antioquia' } } },
            { price: 32, location: { id: 1, name: 'Bogotá', parent: { name: 'Cundinamarca' } } }, // dup
        ] as any)

        const r: any = await cotizacionCalculatorService.getCiudades('CO')
        expect(r.flatRateEnabled).toBe(false)
        expect(r.data).toHaveLength(2)
        expect(r.data[0]).toMatchObject({ id: 1, city: 'Bogotá', department: 'Cundinamarca', basePrice: 30 })
    })
})
