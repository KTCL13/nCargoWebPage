export interface ShippingRateResponseDto {
  id: number;
  providerId: number;
  locationId: number;
  price: number;
}

export interface CreateShippingRateDto {
  locationId: number;
  price: number;
}

export interface UpdateShippingRateDto {
  price?: number;
}
