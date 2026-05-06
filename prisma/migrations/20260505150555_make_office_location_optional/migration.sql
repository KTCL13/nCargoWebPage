-- DropForeignKey
ALTER TABLE "offices" DROP CONSTRAINT "offices_location_id_fkey";

-- AlterTable
ALTER TABLE "offices" ALTER COLUMN "location_id" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "offices" ADD CONSTRAINT "offices_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
