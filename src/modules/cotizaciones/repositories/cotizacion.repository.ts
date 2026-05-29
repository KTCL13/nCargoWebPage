import { prisma } from '@/lib/prisma'

const CONFIG_KEYS = [
  'divisor',
  'insurance_rate',
  'customs_rate',
  'customs_threshold',
  'pickup_base',
  'pickup_per_extra_mile',
  'pickup_free_miles',
  'co_flat_rate_enabled',
  'co_flat_rate_price',
  'mx_flat_rate_enabled',
  'mx_flat_rate_price',
] as const

export type ConfigRow = { key: string; value: unknown }

export type CreateQuotationData = {
  employeeId?: number | null
  destinationLocationId?: number | null
  weightLbs: number
  volume: number
  declaredValue: number
  totalPrice: number
  country: string
  source: string
  status: string
}

export type CreateRecordData = {
  country: string
  destinationLocationId?: number | null
  heightIn: number
  widthIn: number
  lengthIn: number
  actualWeightLb: number
  volumetricWeightLb: number
  chargeableWeightLb: number
  declaredValueUsd: number
  pickupMiles?: number | null
  transport: number
  volumetricSurcharge: number
  insurance: number
  customs: number
  cityDelivery: number
  pickup: number
  total: number
  flatRateApplied: boolean
  source: string
  employeeId?: number | null
  shipmentId?: number | null
  quotationId: number
}

class CotizacionRepository {
  async getConfig(): Promise<ConfigRow[]> {
    return prisma.systemConfig.findMany({
      where: { key: { in: [...CONFIG_KEYS] } },
    })
  }

  async findShippingRateByLocation(locationId: number) {
    return prisma.shippingRate.findFirst({
      where: { locationId },
      include: { location: true },
    })
  }

  async findShippingRatesByCountry(country: string) {
    return prisma.shippingRate.findMany({
      where: { countryCode: country.toUpperCase(), location: { type: 'CITY' } },
      include: { location: { include: { parent: true } } },
      orderBy: { location: { name: 'asc' } },
    })
  }

  async createQuotation(data: CreateQuotationData): Promise<{ id: number }> {
    return prisma.quotation.create({ data: { ...data, status: data.status as never } })
  }

  async createRecord(data: CreateRecordData): Promise<void> {
    await prisma.cotizacionRecord.create({ data })
  }
}

export const cotizacionRepository = new CotizacionRepository()
