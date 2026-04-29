export const SHIPPING_RATES = {
    volumetricDivisor: 153,
    insuranceRate: 0.10,
    brackets: [
        { minLb: 1,  maxLb: 14,  type: 'FIXED' as const,  fixed: 36,    perLb: null },
        { minLb: 15, maxLb: 70,  type: 'PER_LB' as const, fixed: null,  perLb: 2.95 },
        { minLb: 71, maxLb: 110, type: 'PER_LB' as const, fixed: null,  perLb: 3.15 },
    ],
}

export type ShippingBracket = (typeof SHIPPING_RATES.brackets)[number]

export type ShippingCalculation = {
    weight: number
    volumetricWeight: number
    chargeableWeight: number
    rateType: 'FIXED' | 'PER_LB'
    ratePerLb: number | null
    fixedRate: number | null
    shippingPrice: number
}

const round = (value: number, decimals = 2): number => {
    const factor = 10 ** decimals
    return Math.round(value * factor) / factor
}

class ShippingCalculatorService {
    calculateVolumetricWeight(height: number, width: number, length: number): number {
        if (height <= 0 || width <= 0 || length <= 0) return 0
        return round((height * width * length) / SHIPPING_RATES.volumetricDivisor)
    }

    calculateChargeableWeight(weight: number, volumetricWeight: number): number {
        return round(Math.max(weight, volumetricWeight))
    }

    private resolveBracket(chargeableWeight: number): ShippingBracket {
        const bracket = SHIPPING_RATES.brackets.find(
            b => chargeableWeight >= b.minLb && chargeableWeight <= b.maxLb,
        )
        if (!bracket) {
            const max = SHIPPING_RATES.brackets[SHIPPING_RATES.brackets.length - 1].maxLb
            throw new Error(`Peso ${chargeableWeight} lb fuera de rango (1-${max} lb)`)
        }
        return bracket
    }

    calculateShippingPrice(chargeableWeight: number): {
        rateType: 'FIXED' | 'PER_LB'
        ratePerLb: number | null
        fixedRate: number | null
        shippingPrice: number
    } {
        const bracket = this.resolveBracket(chargeableWeight)
        const shippingPrice = bracket.type === 'FIXED'
            ? bracket.fixed!
            : round(chargeableWeight * bracket.perLb!)

        return {
            rateType: bracket.type,
            ratePerLb: bracket.perLb,
            fixedRate: bracket.fixed,
            shippingPrice,
        }
    }

    calculateInsurance(declaredValue: number): number {
        if (declaredValue <= 0) return 0
        return round(declaredValue * SHIPPING_RATES.insuranceRate)
    }

    calculateShipping(input: {
        weight: number
        height: number
        width: number
        length: number
    }): ShippingCalculation {
        const volumetricWeight = this.calculateVolumetricWeight(input.height, input.width, input.length)
        const chargeableWeight = this.calculateChargeableWeight(input.weight, volumetricWeight)
        const { rateType, ratePerLb, fixedRate, shippingPrice } =
            this.calculateShippingPrice(chargeableWeight)

        return {
            weight: input.weight,
            volumetricWeight,
            chargeableWeight,
            rateType,
            ratePerLb,
            fixedRate,
            shippingPrice,
        }
    }
}

export const shippingCalculatorService = new ShippingCalculatorService()
