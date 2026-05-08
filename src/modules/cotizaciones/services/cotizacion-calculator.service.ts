import { prisma } from "@/lib/prisma";
import {
  CalcularCotizacionDto,
  CotizacionBreakdownDto,
  CityDropdownItemDto,
  CiudadesResponseDto,
} from "../dtos/cotizacion.dto";

const roundUp = (v: number) => Math.ceil(v);

const MAX_DECLARED_VALUE_USD = 200;

class CotizacionCalculatorService {
  // ── Config ────────────────────────────────────────────────────────

  private async getConfig(): Promise<Record<string, number | boolean>> {
    const rows = await prisma.systemConfig.findMany({
      where: {
        key: {
          in: [
            "divisor",
            "insurance_rate",
            "customs_rate",
            "customs_threshold",
            "pickup_base",
            "pickup_per_extra_mile",
            "pickup_free_miles",
            "co_flat_rate_enabled",
            "co_flat_rate_price",
            "mx_flat_rate_enabled",
            "mx_flat_rate_price",
          ],
        },
      },
    });
    const cfg: Record<string, number | boolean> = {};
    for (const r of rows) {
      const raw = r.value;
      if (typeof raw === "boolean") cfg[r.key] = raw;
      else cfg[r.key] = Number(raw);
    }
    return cfg;
  }

  // ── Excel transport lookup (Peso table col C, J2) ─────────────────
  private calcTransport(weightLb: number): number {
    if (weightLb <= 14) return 36;
    if (weightLb <= 70) return roundUp(weightLb * 2.95);
    if (weightLb <= 110) return roundUp(weightLb * 3.15);
    throw new Error(`Peso ${weightLb} lb fuera de rango (1–110 lb)`);
  }

  // ── Pickup formula (Recogida sheet, J7) ───────────────────────────
  private calcPickup(
    miles: number,
    base: number,
    perExtra: number,
    freeMiles: number,
  ): number {
    if (miles <= 0) return 0;
    return base + Math.max(0, (miles - freeMiles) * perExtra);
  }

  // ── Main calculation (I3 = SUM J2:J7) ────────────────────────────

  async calculate(
    input: CalcularCotizacionDto,
  ): Promise<CotizacionBreakdownDto> {
    if (input.declaredValueUsd > MAX_DECLARED_VALUE_USD) {
      throw new Error(
        `El valor declarado no puede superar los ${MAX_DECLARED_VALUE_USD} USD`,
      );
    }

    const cfg = await this.getConfig();

    const divisor = (cfg["divisor"] as number) || 153;
    const insRate = (cfg["insurance_rate"] as number) || 0.1;
    const customsRate = (cfg["customs_rate"] as number) || 0.31;
    const customsThresh = (cfg["customs_threshold"] as number) || 200;
    const pickupBase = (cfg["pickup_base"] as number) || 10;
    const perExtra = (cfg["pickup_per_extra_mile"] as number) || 2;
    const freeMiles = (cfg["pickup_free_miles"] as number) || 8;

    const countryKey = input.country.toLowerCase();
    const flatEnabled = Boolean(cfg[`${countryKey}_flat_rate_enabled`]);
    const flatPrice = (cfg[`${countryKey}_flat_rate_price`] as number) || 0;

    // Volumetric weight (Tamaño sheet D4 = ROUNDUP(H*L*W/divisor, 0))
    const volumetricLb = roundUp(
      (input.heightIn * input.lengthIn * input.widthIn) / divisor,
    );

    // J2: transport based on actual weight (Peso VLOOKUP col C)
    const transport = this.calcTransport(input.actualWeightLb);

    // J3: volumetric surcharge = max(0, volumetric − actual), treated as USD
    const volumetricSurcharge = Math.max(
      0,
      volumetricLb - input.actualWeightLb,
    );

    // J4: insurance = ROUNDUP(declared × rate, 0)
    const insurance = roundUp(input.declaredValueUsd * insRate);

    // J5: customs = ROUNDUP(if declared > threshold, declared × rate, 0)
    const customs =
      input.declaredValueUsd > customsThresh
        ? roundUp(input.declaredValueUsd * customsRate)
        : 0;

    // J6: city delivery cost
    let cityDelivery = 0;
    let cityName: string | null = null;

    if (flatEnabled) {
      cityDelivery = flatPrice;
      cityName = `Tarifa plana ${input.country}`;
    } else {
      if (!input.destinationCityId) {
        throw new Error(
          "destinationCityId es requerido cuando la tarifa plana está desactivada para este país",
        );
      }
      const rate = await prisma.shippingRate.findFirst({
        where: { locationId: input.destinationCityId },
        include: { location: true },
      });
      if (!rate)
        throw new Error("No se encontró tarifa para la ciudad seleccionada");
      cityDelivery = Number(rate.price);
      cityName = rate.location.name;
    }

    // J7: pickup
    const pickup = this.calcPickup(
      input.pickupMiles ?? 0,
      pickupBase,
      perExtra,
      freeMiles,
    );

    const total =
      transport +
      volumetricSurcharge +
      insurance +
      customs +
      cityDelivery +
      pickup;

    const chargeableWeightLb = Math.max(input.actualWeightLb, volumetricLb);
    const volume = (input.heightIn * input.widthIn * input.lengthIn) / 1728;
    const source = input.employeeId ? 'EMPLOYEE' : 'PUBLIC';

    // Save to Quotation table (awaited to capture the ID for Odoo linking).
    const quotation = await prisma.quotation.create({
      data: {
        employeeId: input.employeeId ?? null,
        destinationLocationId: input.destinationCityId ?? null,
        weightLbs: chargeableWeightLb,
        volume,
        declaredValue: input.declaredValueUsd,
        totalPrice: total,
        country: input.country,
        source,
        status: 'DRAFT',
      },
    });

    // Fire-and-forget detailed record — never blocks the response.
    prisma.cotizacionRecord
      .create({
        data: {
          country: input.country,
          destinationLocationId: input.destinationCityId ?? null,
          heightIn: input.heightIn,
          widthIn: input.widthIn,
          lengthIn: input.lengthIn,
          actualWeightLb: input.actualWeightLb,
          volumetricWeightLb: volumetricLb,
          chargeableWeightLb,
          declaredValueUsd: input.declaredValueUsd,
          pickupMiles: input.pickupMiles ?? null,
          transport,
          volumetricSurcharge,
          insurance,
          customs,
          cityDelivery,
          pickup,
          total,
          flatRateApplied: flatEnabled,
          source,
          employeeId: input.employeeId ?? null,
          shipmentId: input.shipmentId ?? null,
        },
      })
      .catch((err) => console.error("[CotizacionRecord] save failed:", err));

    const breakdown: CotizacionBreakdownDto = {
      quotationId: quotation.id,
      transport,
      volumetricSurcharge,
      insurance,
      customs,
      cityDelivery,
      pickup,
      total,
      detail: {
        actualWeightLb: input.actualWeightLb,
        volumetricWeightLb: volumetricLb,
        chargeableWeightLb,
        divisorUsed: divisor,
        flatRateApplied: flatEnabled,
        cityName,
      },
    };

    return breakdown;
  }

  // ── Cities dropdown ───────────────────────────────────────────────

  async getCiudades(country: string): Promise<CiudadesResponseDto> {
    const cfg = await this.getConfig();
    const countryKey = country.toLowerCase();
    const flatEnabled = Boolean(cfg[`${countryKey}_flat_rate_enabled`]);
    const flatPrice = (cfg[`${countryKey}_flat_rate_price`] as number) || 0;

    if (flatEnabled) {
      return {
        country: country.toUpperCase(),
        flatRateEnabled: true,
        flatRatePrice: flatPrice,
        data: [],
      };
    }

    const countryName = country.toUpperCase() === "CO" ? "Colombia" : "Mexico";
    const rates = await prisma.shippingRate.findMany({
      where: {
        location: {
          type: "CITY",
          parent: {
            type: "DEPARTMENT",
            parent: { type: "COUNTRY", name: countryName },
          },
        },
      },
      include: { location: { include: { parent: true } } },
      orderBy: { location: { name: "asc" } },
    });

    const seen = new Set<number>();
    const data: CityDropdownItemDto[] = [];
    for (const r of rates) {
      if (seen.has(r.location.id)) continue;
      seen.add(r.location.id);
      data.push({
        id: r.location.id,
        city: r.location.name,
        department: r.location.parent?.name ?? "",
        basePrice: Number(r.price),
      });
    }

    return {
      country: country.toUpperCase(),
      flatRateEnabled: false,
      flatRatePrice: 0,
      data,
    };
  }
}

export const cotizacionCalculatorService = new CotizacionCalculatorService();
