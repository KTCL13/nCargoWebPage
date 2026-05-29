import { prisma } from "@/lib/prisma";
import { SimpleCalculatorDto } from "../dtos/simple-calculator.dto";
import {
  QuotationCalculationDto,
  SimpleQuotationResponseDto,
} from "../dtos/quotation-calculation.dto";
import { quotationRepository } from "../repositories/quotation.repository";
import { shippingCalculatorService } from "./shipping-calculator.service";

const round = (value: number, decimals = 2): number => {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
};

class QuotationService {
  private async resolveDefaultEmployeeId(): Promise<number> {
    const employee = await prisma.employee.findFirst({
      where: { status: "ACTIVE" },
      orderBy: { id: "asc" },
    });
    if (!employee)
      throw new Error("No hay empleados activos para asociar la cotización");
    return employee.id;
  }

  private async buildSimpleCalculation(
    input: SimpleCalculatorDto,
  ): Promise<QuotationCalculationDto> {
    const shipping = await shippingCalculatorService.calculateShipping({
      weight: input.weight,
      height: input.height,
      width: input.width,
      length: input.length,
    });

    const insurance = await shippingCalculatorService.calculateInsurance(
      input.declaredValue,
    );
    const subtotal = round(shipping.shippingPrice + insurance);
    const total = subtotal;

    return { shipping, insurance, subtotal, total };
  }

  async calculateSimple(
    input: SimpleCalculatorDto,
  ): Promise<QuotationCalculationDto> {
    return this.buildSimpleCalculation(input);
  }

  async createSimple(
    input: SimpleCalculatorDto,
  ): Promise<SimpleQuotationResponseDto> {
    const calculation = await this.buildSimpleCalculation(input);

    // Resolve destination location (city)
    const destinationLocation = await prisma.location.findFirst({
      where: {
        name: { equals: input.city, mode: "insensitive" },
        type: "CITY",
      },
    });
    if (!destinationLocation) {
      throw new Error(`Ciudad "${input.city}" no encontrada`);
    }

    // Get or create default origin office
    const originOffice = await prisma.office.findFirst({
      where: { isActive: true },
      orderBy: { id: "asc" },
    });
    if (!originOffice) {
      throw new Error(
        "No hay oficina activa configurada para las cotizaciones",
      );
    }

    const employeeId = input.employeeId
      ? input.employeeId
      : await this.resolveDefaultEmployeeId();

    const volume = (input.height * input.width * input.length) / 1728; // cubic inches to cubic feet

    const quotation = await quotationRepository.createSimple({
      employeeId,
      status: "DRAFT",
      odooCustomerId: input.odooCustomerId ?? null,
      destinationLocationId: destinationLocation.id,
      weightLbs: calculation.shipping.chargeableWeight,
      volume: Number(volume),
      declaredValue: input.declaredValue,
      totalPrice: calculation.total,
      originOfficeId: originOffice.id,
    });

    return { quotationId: quotation.id, calculation };
  }
}

export const quotationService = new QuotationService();
