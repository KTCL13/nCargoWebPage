import { prisma } from "@/lib/prisma";
import {
  CreateShippingRateDto,
  UpdateShippingRateDto,
} from "../dtos/shipping-rate.dto";

class ShippingProviderRepository {
  findAll() {
    return prisma.shippingProvider.findMany({ orderBy: { name: "asc" } });
  }

  findById(id: number) {
    return prisma.shippingProvider.findUnique({ where: { id } });
  }

  getRates(providerId: number) {
    return prisma.shippingRate.findMany({
      where: { providerId },
      include: { location: true },
      orderBy: { location: { name: "asc" } },
    });
  }

  createRate(providerId: number, dto: CreateShippingRateDto) {
    return prisma.shippingRate.create({
      data: {
        providerId,
        locationId: dto.locationId,
        price: dto.price,
      },
      include: { location: true },
    });
  }

  updateRate(rateId: number, dto: UpdateShippingRateDto) {
    return prisma.shippingRate.update({
      where: { id: rateId },
      data: {
        ...(dto.price !== undefined && { price: dto.price }),
      },
      include: { location: true },
    });
  }

  deleteRate(rateId: number) {
    return prisma.shippingRate.delete({ where: { id: rateId } });
  }

  getRateById(rateId: number) {
    return prisma.shippingRate.findUnique({
      where: { id: rateId },
      include: { location: true },
    });
  }
}

export const shippingProviderRepository = new ShippingProviderRepository();
