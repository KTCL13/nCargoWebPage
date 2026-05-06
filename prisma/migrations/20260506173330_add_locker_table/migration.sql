-- AlterTable
ALTER TABLE "shipments" ADD COLUMN     "locker_id" INTEGER;

-- CreateTable
CREATE TABLE "lockers" (
    "id" SERIAL NOT NULL,
    "odoo_project_id" INTEGER NOT NULL,
    "odoo_project_name" VARCHAR(255) NOT NULL,
    "customer_name" VARCHAR(255),
    "customer_email" VARCHAR(255),
    "last_synced_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lockers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "lockers_odoo_project_id_key" ON "lockers"("odoo_project_id");

-- AddForeignKey
ALTER TABLE "shipments" ADD CONSTRAINT "shipments_locker_id_fkey" FOREIGN KEY ("locker_id") REFERENCES "lockers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
