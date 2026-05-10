-- Add code field to locations (stores ISO 2-letter code for COUNTRY rows)
ALTER TABLE "locations" ADD COLUMN "code" VARCHAR(10);

-- Backfill known countries
UPDATE "locations" SET "code" = 'CO' WHERE "name" = 'Colombia'    AND "type" = 'COUNTRY';
UPDATE "locations" SET "code" = 'MX' WHERE "name" = 'Mexico'      AND "type" = 'COUNTRY';
UPDATE "locations" SET "code" = 'US' WHERE "name" ILIKE 'united%' AND "type" = 'COUNTRY';

-- Add country_code to shipping_rates (denormalized shortcut)
ALTER TABLE "shipping_rates" ADD COLUMN "country_code" VARCHAR(10);

-- Backfill from 3-level hierarchy (City -> Department -> Country)
UPDATE "shipping_rates" sr
SET "country_code" = c."code"
FROM "locations" city
JOIN "locations" dept ON city."parent_id" = dept."id"
JOIN "locations" c    ON dept."parent_id" = c."id"
WHERE sr."location_id" = city."id"
  AND c."type" = 'COUNTRY'
  AND c."code" IS NOT NULL;
