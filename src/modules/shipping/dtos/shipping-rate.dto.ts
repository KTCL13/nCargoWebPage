export interface ShippingRateResponseDto {
  id: number;
  providerId: number;
  destination: { id: number; city: string; region: string | null; regionId: number | null; country: string };
  basePrice: number;
}

export interface CreateShippingRateDto {
  destinationId: number;
  basePrice: number;
  countryCode?: string;
}

export interface UpdateShippingRateDto {
  basePrice?: number;
}
