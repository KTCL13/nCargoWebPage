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
  price: number | Decimal;
  countryCode: string | null;
  location: {
    id: number;
    name: string;
    parent: { id: number; name: string } | null;
  };
};

function toRateDto(r: ShippingRateSource): ShippingRateResponseDto {
  return {
    id: r.id,
    providerId: r.providerId,
    destination: {
      id: r.location.id,
      city: r.location.name,
      region: r.location.parent?.name ?? null,
      regionId: r.location.parent?.id ?? null,
      country: r.countryCode ?? '',
    },
    basePrice: Number(r.price),
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
