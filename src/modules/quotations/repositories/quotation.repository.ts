import { prisma } from "@/lib/prisma";
import { Quotation, QuotationStatus } from "@prisma/client";

export type CreateSimpleQuotationData = {
  employeeId: number;
  status?: QuotationStatus;
  odooCustomerId?: number | null;
  destinationLocationId: number;
  weightLbs: number;
  volume: number;
  declaredValue: number;
  totalPrice: number;
  originOfficeId: number;
};

export type UpdateOdooInfoData = {
  odooCustomerId: number
  odooOrderId: number
  odooOrderName: string
}

class QuotationRepository {
  async createSimple(data: CreateSimpleQuotationData): Promise<Quotation> {
    return prisma.quotation.create({
      data: {
        employeeId: data.employeeId,
        status: data.status ?? "DRAFT",
        odooCustomerId: data.odooCustomerId ?? null,
        destinationLocationId: data.destinationLocationId,
        weightLbs: data.weightLbs,
        volume: data.volume,
        declaredValue: data.declaredValue,
        totalPrice: data.totalPrice,
        originOfficeId: data.originOfficeId,
      },
    });
  }

  async updateOdooInfo(id: number, data: UpdateOdooInfoData): Promise<Quotation> {
    return prisma.quotation.update({
      where: { id },
      data: {
        odooCustomerId: data.odooCustomerId,
        odooOrderId: data.odooOrderId,
        odooOrderName: data.odooOrderName,
        status: 'SENT',
      },
    });
  }
}

export const quotationRepository = new QuotationRepository();
