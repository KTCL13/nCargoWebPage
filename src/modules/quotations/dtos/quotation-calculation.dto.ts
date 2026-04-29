export type ShippingBreakdownDto = {
  weight: number;
  volumetricWeight: number;
  chargeableWeight: number;
  rateType: "FIXED" | "PER_LB";
  ratePerLb: number | null;
  fixedRate: number | null;
  shippingPrice: number;
};

export type QuotationCalculationDto = {
  shipping: ShippingBreakdownDto;
  insurance: number;
  subtotal: number;
  total: number;
};

export type SimpleQuotationResponseDto = {
  quotationId: number | null;
  calculation: QuotationCalculationDto;
};
