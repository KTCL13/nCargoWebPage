-- AlterTable
ALTER TABLE "attendance" ADD COLUMN     "timezone" TEXT NOT NULL DEFAULT 'America/Bogota';

-- AlterTable
ALTER TABLE "employees" ADD COLUMN     "timezone" TEXT NOT NULL DEFAULT 'America/Bogota';
