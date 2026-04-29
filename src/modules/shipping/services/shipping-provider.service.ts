import { shippingProviderRepository } from "../repositories/shipping-provider.repository";
import { Prisma } from "@prisma/client";
import {
  ShippingRateResponseDto,
  CreateShippingRateDto,
  UpdateShippingRateDto,
} from "../dtos/shipping-rate.dto";

type Decimal = Prisma.Decimal;

type ShippingRateSource = {
  id: number;
  providerId: number;
  locationId: number;
  price: number | Decimal;
};

function toRateDto(r: ShippingRateSource): ShippingRateResponseDto {
  const locationId = "locationId" in r ? r.locationId : 0;
  const price = "price" in r ? Number(r.price) : 0;

  return {
    id: r.id,
    providerId: r.providerId,
    locationId,
    price,
  };
}

class ShippingProviderService {
  async findAll() {
    return shippingProviderRepository.findAll();
  }

  async getRates(providerId: number): Promise<ShippingRateResponseDto[]> {
    const provider = await shippingProviderRepository.findById(providerId);
    if (!provider) throw new Error(`Provider ${providerId} no encontrado`);
    const rates = await shippingProviderRepository.getRates(providerId);
    return rates.map(toRateDto);
  }

  async createRate(
    providerId: number,
    dto: CreateShippingRateDto,
  ): Promise<ShippingRateResponseDto> {
    const provider = await shippingProviderRepository.findById(providerId);
    if (!provider) throw new Error(`Provider ${providerId} no encontrado`);

    const rate = await shippingProviderRepository.createRate(providerId, dto);
    return toRateDto(rate);
  }

  async updateRate(
    providerId: number,
    rateId: number,
    dto: UpdateShippingRateDto,
  ): Promise<ShippingRateResponseDto> {
    const existing = await shippingProviderRepository.getRateById(rateId);
    if (!existing || existing.providerId !== providerId) {
      throw new Error("Tarifa no encontrada");
    }
    const updated = await shippingProviderRepository.updateRate(rateId, dto);
    return toRateDto(updated);
  }

  async deleteRate(providerId: number, rateId: number): Promise<void> {
    const existing = await shippingProviderRepository.getRateById(rateId);
    if (!existing || existing.providerId !== providerId) {
      throw new Error("Tarifa no encontrada");
    }
    await shippingProviderRepository.deleteRate(rateId);
  }
}

export const shippingProviderService = new ShippingProviderService();
