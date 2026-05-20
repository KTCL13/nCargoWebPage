export type DestLocation = {
  name: string
  type: string
  parent: { name: string; parent: { name: string } | null } | null
} | null

export interface CotizacionRecord {
  id: number
  country: string
  heightIn: string
  widthIn: string
  lengthIn: string
  actualWeightLb: string
  volumetricWeightLb: string
  chargeableWeightLb: string
  declaredValueUsd: string
  pickupMiles: string | null
  transport: string
  volumetricSurcharge: string
  insurance: string
  customs: string
  cityDelivery: string
  pickup: string
  total: string
  flatRateApplied: boolean
  createdAt: string
  employee: { id: number; firstName: string; lastName: string } | null
  destinationLocation: DestLocation
  quotation: { id: number; odooCustomerId: number | null; odooOrderName: string | null; status: string } | null
}

export interface Office {
  id: number
  name: string
  address: string
  latitude: number | string
  longitude: number | string
  coverageRadiusMiles: number | string | null
  isActive: boolean
}

export type QuotationTab = 'publica' | 'empleados' | 'offices'
