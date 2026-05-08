ALTER TABLE "cotizacion_records" ADD COLUMN "quotation_id" INTEGER;

ALTER TABLE "cotizacion_records"
  ADD CONSTRAINT "cotizacion_records_quotation_id_fkey"
  FOREIGN KEY ("quotation_id") REFERENCES "quotations"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
