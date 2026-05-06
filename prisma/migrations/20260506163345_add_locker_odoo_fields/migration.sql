-- AlterTable
ALTER TABLE "shipments" ADD COLUMN     "is_locker" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "odoo_customer_name" VARCHAR(255),
ADD COLUMN     "odoo_project_id" INTEGER,
ADD COLUMN     "odoo_project_name" VARCHAR(255),
ADD COLUMN     "odoo_stage_name" VARCHAR(100),
ADD COLUMN     "odoo_task_id" INTEGER;
