import { prisma } from "@/lib/prisma";
import { CreatePickupPointInput, UpdatePickupPointInput } from "@/lib/validations/pickupPoints";

export class PickupPointsService {
  async findAll(page: number, pageSize: number, onlyActive: boolean) {
    const where = onlyActive ? { isActive: true } : {};

    if (pageSize > 0) {
      const [data, total] = await Promise.all([
        prisma.office.findMany({
          skip: (page - 1) * pageSize,
          take: pageSize,
          where,
          orderBy: { name: "asc" },
        }),
        prisma.office.count({ where }),
      ]);
      return {
        data,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      };
    }

    const data = await prisma.office.findMany({
      where,
      orderBy: { name: "asc" },
    });
    return { data, total: data.length };
  }

  async create(data: CreatePickupPointInput) {
    return prisma.office.create({
      data: {
        name: data.name,
        address: data.address,
        latitude: data.latitude,
        longitude: data.longitude,
        coverageRadiusMiles: data.coverageRadiusMiles ?? null,
        isActive: true,
      },
    });
  }

  async update(id: number, data: UpdatePickupPointInput) {
    return prisma.office.update({
      where: { id },
      data: {
        ...(data.name != null && { name: data.name }),
        ...(data.address != null && { address: data.address }),
        ...(data.latitude != null && { latitude: data.latitude }),
        ...(data.longitude != null && { longitude: data.longitude }),
        ...(data.coverageRadiusMiles !== undefined && {
          coverageRadiusMiles: data.coverageRadiusMiles ?? null,
        }),
        ...(data.isActive != null && { isActive: data.isActive }),
      },
    });
  }

  async delete(id: number) {
    return prisma.office.delete({ where: { id } });
  }
}

export const pickupPointsService = new PickupPointsService();
