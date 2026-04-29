/*
  Warnings:

  - You are about to drop the column `city_id` on the `offices` table. All the data in the column will be lost.
  - You are about to drop the column `destination_city_id` on the `quotations` table. All the data in the column will be lost.
  - You are about to drop the column `city_id` on the `shipping_rates` table. All the data in the column will be lost.
  - You are about to drop the `cities` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `countries` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `departments` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[provider_id,location_id]` on the table `shipping_rates` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `location_id` to the `offices` table without a default value. This is not possible if the table is not empty.
  - Added the required column `destination_location_id` to the `quotations` table without a default value. This is not possible if the table is not empty.
  - Added the required column `location_id` to the `shipping_rates` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "cities" DROP CONSTRAINT "cities_department_id_fkey";

-- DropForeignKey
ALTER TABLE "departments" DROP CONSTRAINT "departments_country_id_fkey";

-- DropForeignKey
ALTER TABLE "offices" DROP CONSTRAINT "offices_city_id_fkey";

-- DropForeignKey
ALTER TABLE "quotations" DROP CONSTRAINT "quotations_destination_city_id_fkey";

-- DropForeignKey
ALTER TABLE "shipping_rates" DROP CONSTRAINT "shipping_rates_city_id_fkey";

-- DropIndex
DROP INDEX "shipping_rates_provider_id_city_id_key";

-- AlterTable
ALTER TABLE "offices" DROP COLUMN "city_id",
ADD COLUMN     "location_id" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "quotations" DROP COLUMN "destination_city_id",
ADD COLUMN     "destination_location_id" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "shipping_rates" DROP COLUMN "city_id",
ADD COLUMN     "location_id" INTEGER NOT NULL;

-- DropTable
DROP TABLE "cities";

-- DropTable
DROP TABLE "countries";

-- DropTable
DROP TABLE "departments";

-- CreateTable
CREATE TABLE "locations" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "type" VARCHAR(20) NOT NULL,
    "zip_code" VARCHAR(20),
    "parent_id" INTEGER,

    CONSTRAINT "locations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cotizacion_records" (
    "id" SERIAL NOT NULL,
    "country" VARCHAR(2) NOT NULL,
    "destination_location_id" INTEGER,
    "height_in" DECIMAL(8,2) NOT NULL,
    "width_in" DECIMAL(8,2) NOT NULL,
    "length_in" DECIMAL(8,2) NOT NULL,
    "actual_weight_lb" DECIMAL(8,2) NOT NULL,
    "volumetric_weight_lb" DECIMAL(8,2) NOT NULL,
    "chargeable_weight_lb" DECIMAL(8,2) NOT NULL,
    "declared_value_usd" DECIMAL(12,2) NOT NULL,
    "pickup_miles" DECIMAL(8,2),
    "transport" DECIMAL(12,2) NOT NULL,
    "volumetric_surcharge" DECIMAL(12,2) NOT NULL,
    "insurance" DECIMAL(12,2) NOT NULL,
    "customs" DECIMAL(12,2) NOT NULL,
    "city_delivery" DECIMAL(12,2) NOT NULL,
    "pickup" DECIMAL(12,2) NOT NULL,
    "total" DECIMAL(12,2) NOT NULL,
    "flat_rate_applied" BOOLEAN NOT NULL DEFAULT false,
    "employee_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cotizacion_records_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "shipping_rates_provider_id_location_id_key" ON "shipping_rates"("provider_id", "location_id");

-- AddForeignKey
ALTER TABLE "locations" ADD CONSTRAINT "locations_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "locations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "offices" ADD CONSTRAINT "offices_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "locations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shipping_rates" ADD CONSTRAINT "shipping_rates_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "locations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quotations" ADD CONSTRAINT "quotations_destination_location_id_fkey" FOREIGN KEY ("destination_location_id") REFERENCES "locations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cotizacion_records" ADD CONSTRAINT "cotizacion_records_destination_location_id_fkey" FOREIGN KEY ("destination_location_id") REFERENCES "locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cotizacion_records" ADD CONSTRAINT "cotizacion_records_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;
