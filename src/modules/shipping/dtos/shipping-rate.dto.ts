export interface ShippingRateResponseDto {
  id: number;
  providerId: number;
  destination: { id: number; city: string; region: string | null; country: string };
  basePrice: number;
}

export interface CreateShippingRateDto {
  destinationId: number;
  basePrice: number;
}

export interface UpdateShippingRateDto {
  basePrice?: number;
}
