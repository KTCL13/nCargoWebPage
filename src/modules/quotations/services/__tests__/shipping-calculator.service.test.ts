/// <reference types="jest" />

jest.mock('@/lib/prisma', () => ({
    prisma: {
        systemConfig: { findMany: jest.fn() },
    },
}))

import { shippingCalculatorService, DEFAULT_SHIPPING_RATES } from '../shipping-calculator.service'
import { prisma } from '@/lib/prisma'

const mocked = <T extends (...args: any) => any>(fn: T) => fn as unknown as jest.Mock

function defaultConfigRows() {
    return [
        { key: 'quotation_volumetric_divisor', value: DEFAULT_SHIPPING_RATES.volumetricDivisor },
        { key: 'quotation_insurance_rate',     value: DEFAULT_SHIPPING_RATES.insuranceRate },
        { key: 'quotation_brackets',           value: DEFAULT_SHIPPING_RATES.brackets },
    ]
}

beforeEach(() => {
    jest.clearAllMocks()
    mocked(prisma.systemConfig.findMany).mockResolvedValue(defaultConfigRows())
})

describe('shippingCalculatorService.calculateVolumetricWeight', () => {
    it('G1 normal dimensions: divides by configured divisor', () => {
        expect(shippingCalculatorService.calculateVolumetricWeight(10, 10, 10))
            .toBeCloseTo(1000 / DEFAULT_SHIPPING_RATES.volumetricDivisor, 2)
    })

    it('G2 any dimension ≤ 0 returns 0', () => {
        expect(shippingCalculatorService.calculateVolumetricWeight(0, 5, 5)).toBe(0)
        expect(shippingCalculatorService.calculateVolumetricWeight(5, -1, 5)).toBe(0)
    })

    it('G3 large dimensions: keeps 2 decimals', () => {
        const v = shippingCalculatorService.calculateVolumetricWeight(50, 50, 50)
        expect(v).toBe(Math.round((125_000 / 153) * 100) / 100)
    })
})

describe('shippingCalculatorService.calculateChargeableWeight', () => {
    it('G1 returns the greater of actual vs volumetric', () => {
        expect(shippingCalculatorService.calculateChargeableWeight(10, 8)).toBe(10)
        expect(shippingCalculatorService.calculateChargeableWeight(5, 8)).toBe(8)
    })

    it('G2 equal: returns the value', () => {
        expect(shippingCalculatorService.calculateChargeableWeight(7, 7)).toBe(7)
    })
})

describe('shippingCalculatorService.calculateShippingPrice — brackets', () => {
    const brackets = DEFAULT_SHIPPING_RATES.brackets

    it('G1 1–14 lb: FIXED $36', () => {
        const r = shippingCalculatorService.calculateShippingPrice(10, brackets)
        expect(r.rateType).toBe('FIXED')
        expect(r.shippingPrice).toBe(36)
    })

    it('G2 boundary 14 lb: still FIXED $36', () => {
        expect(shippingCalculatorService.calculateShippingPrice(14, brackets).shippingPrice).toBe(36)
    })

    it('G3 15–70 lb: PER_LB at $2.95', () => {
        const r = shippingCalculatorService.calculateShippingPrice(20, brackets)
        expect(r.rateType).toBe('PER_LB')
        expect(r.ratePerLb).toBe(2.95)
        expect(r.shippingPrice).toBe(20 * 2.95)
    })

    it('G4 71–110 lb: PER_LB at $3.15', () => {
        const r = shippingCalculatorService.calculateShippingPrice(100, brackets)
        expect(r.ratePerLb).toBe(3.15)
        expect(r.shippingPrice).toBe(Math.round(100 * 3.15 * 100) / 100)
    })

    it('G5 >110 lb: throws out-of-range', () => {
        expect(() => shippingCalculatorService.calculateShippingPrice(200, brackets)).toThrow(/fuera de rango/)
    })

    it('G6 <1 lb: throws out-of-range (no bracket matches)', () => {
        expect(() => shippingCalculatorService.calculateShippingPrice(0, brackets)).toThrow(/fuera de rango/)
    })
})

describe('shippingCalculatorService.calculateInsurance', () => {
    it('G1 declaredValue > 0: 10% of value', async () => {
        expect(await shippingCalculatorService.calculateInsurance(100)).toBe(10)
    })

    it('G2 declaredValue=0: returns 0 without DB call', async () => {
        expect(await shippingCalculatorService.calculateInsurance(0)).toBe(0)
        expect(prisma.systemConfig.findMany).not.toHaveBeenCalled()
    })

    it('G3 negative declaredValue: returns 0 without DB call', async () => {
        expect(await shippingCalculatorService.calculateInsurance(-50)).toBe(0)
        expect(prisma.systemConfig.findMany).not.toHaveBeenCalled()
    })

    it('G4 uses DB-configured rate when available', async () => {
        mocked(prisma.systemConfig.findMany).mockResolvedValue([
            { key: 'quotation_volumetric_divisor', value: 153 },
            { key: 'quotation_insurance_rate',     value: 0.2 },
            { key: 'quotation_brackets',           value: DEFAULT_SHIPPING_RATES.brackets },
        ])
        expect(await shippingCalculatorService.calculateInsurance(100)).toBe(20)
    })
})

describe('shippingCalculatorService.calculateShipping (end-to-end)', () => {
    it('G1 lightweight box: actual weight wins, FIXED rate', async () => {
        const r = await shippingCalculatorService.calculateShipping({ weight: 5, height: 2, width: 2, length: 2 })
        expect(r.chargeableWeight).toBe(5)
        expect(r.shippingPrice).toBe(36)
    })

    it('G2 oversized but light: volumetric wins', async () => {
        // 12*12*12 = 1728 in³ / 153 ≈ 11.3 lb volumetric vs 2 lb actual
        const r = await shippingCalculatorService.calculateShipping({ weight: 2, height: 12, width: 12, length: 12 })
        expect(r.chargeableWeight).toBeGreaterThan(r.weight)
    })

    it('G3 propagates out-of-range when chargeable exceeds 110 lb', async () => {
        await expect(
            shippingCalculatorService.calculateShipping({ weight: 150, height: 1, width: 1, length: 1 }),
        ).rejects.toThrow(/fuera de rango/)
    })

    it('G4 uses custom brackets from DB', async () => {
        mocked(prisma.systemConfig.findMany).mockResolvedValue([
            { key: 'quotation_volumetric_divisor', value: 153 },
            { key: 'quotation_insurance_rate',     value: 0.1 },
            { key: 'quotation_brackets',           value: [
                { minLb: 1, maxLb: 200, type: 'FIXED', fixed: 99, perLb: null },
            ]},
        ])
        const r = await shippingCalculatorService.calculateShipping({ weight: 50, height: 1, width: 1, length: 1 })
        expect(r.shippingPrice).toBe(99)
    })
})
