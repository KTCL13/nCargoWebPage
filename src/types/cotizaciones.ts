export type Country = 'CO' | 'MX'

export type CityItem = { 
  id: number; 
  city: string; 
  department: string | null 
}

export type Breakdown = {
  total: number
  transport: number
  volumetricSurcharge: number
  insurance: number
  customs: number
  cityDelivery: number
  pickup: number
  detail: {
    actualWeightLb: number
    volumetricWeightLb: number
    chargeableWeightLb: number
    flatRateApplied: boolean
    cityName: string | null
  }
}

export type Office = {
  id: number
  name: string
  address: string
  latitude: number | string
  longitude: number | string
}

export type Dimensions = {
  h: string
  w: string
  l: string
}
