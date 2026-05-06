export interface CalcularCotizacionDto {
  country: 'CO' | 'MX'
  destinationCityId?: number       // required when flat_rate disabled for the country (Excel col G)
  heightIn: number                 // Excel col B — Alto (inches)
  lengthIn: number                 // Excel col C — Largo (inches)
  widthIn: number                  // Excel col D — Ancho (inches)
  actualWeightLb: number           // Excel col A — Peso (lb)
  declaredValueUsd: number         // Excel col F — Valor declarado (USD)
  pickupMiles?: number             // Excel col H — Millas de recogida (default 0)
  employeeId?: number              // set by employee dashboard; absent on public quotes
  shipmentId?: number              // links the quote to a specific envío/locker task
}

export interface CotizacionBreakdownDto {
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
