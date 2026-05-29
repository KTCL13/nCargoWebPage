import { z } from 'zod'

const posNum = (label: string) =>
  z.number({ error: `"${label}" debe ser un número válido` })
   .positive(`"${label}" debe ser mayor a cero`)

export const CalcularCotizacionSchema = z.object({
  country:           z.enum(['CO', 'MX'], { error: 'Selecciona un país de destino: Colombia (CO) o México (MX)' }),
  destinationCityId: z.number().int().positive().optional(),
  heightIn:          posNum('Alto'),
  lengthIn:          posNum('Largo'),
  widthIn:           posNum('Ancho'),
  actualWeightLb:    posNum('Peso real'),
  declaredValueUsd:  z.number({ error: '"Valor declarado" debe ser un número válido' }).min(0, '"Valor declarado" no puede ser negativo').optional().default(0),
  pickupMiles:       z.number().min(0).optional().default(0),
  employeeId:        z.number().int().positive().optional(),
  shipmentId:        z.number().int().positive().optional(),
})

export interface CalcularCotizacionDto {
  country: 'CO' | 'MX'
  destinationCityId?: number
  heightIn: number
  lengthIn: number
  widthIn: number
  actualWeightLb: number
  declaredValueUsd: number
  pickupMiles?: number
  employeeId?: number
  shipmentId?: number
}

export interface CotizacionBreakdownDto {
  quotationId: number
  transport: number
  volumetricSurcharge: number
  insurance: number
  customs: number
  cityDelivery: number
  pickup: number
  total: number
  detail: {
    actualWeightLb: number
    volumetricWeightLb: number
    chargeableWeightLb: number
    divisorUsed: number
    flatRateApplied: boolean
    cityName: string | null
  }
}

export interface CityDropdownItemDto {
  id: number
  city: string
  department: string | null
  basePrice: number
}

export interface CiudadesResponseDto {
  country: string
  flatRateEnabled: boolean
  flatRatePrice: number
  data: CityDropdownItemDto[]
}
