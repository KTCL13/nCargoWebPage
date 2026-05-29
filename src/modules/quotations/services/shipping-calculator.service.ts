import { prisma } from '@/lib/prisma'

export type ShippingBracket = {
    minLb: number
    maxLb: number
    type: 'FIXED' | 'PER_LB'
    fixed: number | null
    perLb: number | null
}

export type ShippingRatesConfig = {
    volumetricDivisor: number
    insuranceRate: number
    brackets: ShippingBracket[]
}

export type ShippingCalculation = {
    weight: number
    volumetricWeight: number
    chargeableWeight: number
    rateType: 'FIXED' | 'PER_LB'
    ratePerLb: number | null
    fixedRate: number | null
    shippingPrice: number
}

// Fallback used when SystemConfig keys are missing (first deploy / test env).
export const DEFAULT_SHIPPING_RATES: ShippingRatesConfig = {
    volumetricDivisor: 153,
    insuranceRate: 0.10,
    brackets: [
        { minLb: 1,  maxLb: 14,  type: 'FIXED',  fixed: 36,   perLb: null },
        { minLb: 15, maxLb: 70,  type: 'PER_LB', fixed: null, perLb: 2.95 },
        { minLb: 71, maxLb: 110, type: 'PER_LB', fixed: null, perLb: 3.15 },
    ],
}

const round = (value: number, decimals = 2): number => {
    const factor = 10 ** decimals
    return Math.round(value * factor) / factor
}

class ShippingCalculatorService {

    private async getConfig(): Promise<ShippingRatesConfig> {
        const rows = await prisma.systemConfig.findMany({
            where: { key: { in: ['quotation_volumetric_divisor', 'quotation_insurance_rate', 'quotation_brackets'] } },
        })
        const map: Record<string, unknown> = Object.fromEntries(rows.map(r => [r.key, r.value]))

        return {
            volumetricDivisor: map['quotation_volumetric_divisor'] != null
                ? Number(map['quotation_volumetric_divisor'])
                : DEFAULT_SHIPPING_RATES.volumetricDivisor,
            insuranceRate: map['quotation_insurance_rate'] != null
                ? Number(map['quotation_insurance_rate'])
                : DEFAULT_SHIPPING_RATES.insuranceRate,
            brackets: Array.isArray(map['quotation_brackets'])
                ? (map['quotation_brackets'] as ShippingBracket[])
                : DEFAULT_SHIPPING_RATES.brackets,
        }
    }

    calculateVolumetricWeight(height: number, width: number, length: number, divisor = DEFAULT_SHIPPING_RATES.volumetricDivisor): number {
        if (height <= 0 || width <= 0 || length <= 0) return 0
        return round((height * width * length) / divisor)
    }

    calculateChargeableWeight(weight: number, volumetricWeight: number): number {
        return round(Math.max(weight, volumetricWeight))
    }

    calculateShippingPrice(chargeableWeight: number, brackets: ShippingBracket[] = DEFAULT_SHIPPING_RATES.brackets): {
        rateType: 'FIXED' | 'PER_LB'
        ratePerLb: number | null
        fixedRate: number | null
        shippingPrice: number
    } {
        const bracket = brackets.find(b => chargeableWeight >= b.minLb && chargeableWeight <= b.maxLb)
        if (!bracket) {
            const max = brackets[brackets.length - 1]?.maxLb ?? 110
            throw new Error(`Peso ${chargeableWeight} lb fuera de rango (1-${max} lb)`)
        }
        const shippingPrice = bracket.type === 'FIXED'
            ? bracket.fixed!
            : round(chargeableWeight * bracket.perLb!)

        return { rateType: bracket.type, ratePerLb: bracket.perLb, fixedRate: bracket.fixed, shippingPrice }
    }

    async calculateInsurance(declaredValue: number): Promise<number> {
        if (declaredValue <= 0) return 0
        const { insuranceRate } = await this.getConfig()
        return round(declaredValue * insuranceRate)
    }

    async calculateShipping(input: { weight: number; height: number; width: number; length: number }): Promise<ShippingCalculation> {
        const cfg = await this.getConfig()
        const volumetricWeight = this.calculateVolumetricWeight(input.height, input.width, input.length, cfg.volumetricDivisor)
        const chargeableWeight = this.calculateChargeableWeight(input.weight, volumetricWeight)
        const { rateType, ratePerLb, fixedRate, shippingPrice } = this.calculateShippingPrice(chargeableWeight, cfg.brackets)

        return { weight: input.weight, volumetricWeight, chargeableWeight, rateType, ratePerLb, fixedRate, shippingPrice }
    }
}

export const shippingCalculatorService = new ShippingCalculatorService()
