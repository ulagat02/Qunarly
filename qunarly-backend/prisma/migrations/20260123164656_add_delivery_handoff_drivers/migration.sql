/*
  Warnings:

  - The values [ACCEPTED,IN_TRANSIT] on the enum `DeliveryLegStatus` will be removed. If these variants are still used in the database, this will fail.
  - The values [ACCEPTED,PICKUP_STARTED] on the enum `ShipmentJobStatus` will be removed. If these variants are still used in the database, this will fail.
  - The `sourceType` column on the `ShipmentJob` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "LogisticsSourceType" AS ENUM ('DEAL', 'ORDER', 'MANUAL');

-- CreateEnum
CREATE TYPE "DriverType" AS ENUM ('VILLAGE_TO_DISTRICT', 'DISTRICT_TO_CITY', 'VILLAGE_TO_CITY');

-- AlterEnum
BEGIN;
CREATE TYPE "DeliveryLegStatus_new" AS ENUM ('PENDING', 'IN_PROGRESS', 'HANDED_OFF', 'COMPLETED');
ALTER TABLE "DeliveryLeg" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "DeliveryLeg" ALTER COLUMN "status" TYPE "DeliveryLegStatus_new" USING ("status"::text::"DeliveryLegStatus_new");
ALTER TYPE "DeliveryLegStatus" RENAME TO "DeliveryLegStatus_old";
ALTER TYPE "DeliveryLegStatus_new" RENAME TO "DeliveryLegStatus";
DROP TYPE "DeliveryLegStatus_old";
ALTER TABLE "DeliveryLeg" ALTER COLUMN "status" SET DEFAULT 'PENDING';
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "ShipmentJobStatus_new" AS ENUM ('CREATED', 'OFFERED', 'ASSIGNED', 'PICKED_UP', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED', 'DELAYED', 'DISPUTED');
ALTER TABLE "ShipmentJob" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "ShipmentJob" ALTER COLUMN "status" TYPE "ShipmentJobStatus_new" USING ("status"::text::"ShipmentJobStatus_new");
ALTER TYPE "ShipmentJobStatus" RENAME TO "ShipmentJobStatus_old";
ALTER TYPE "ShipmentJobStatus_new" RENAME TO "ShipmentJobStatus";
DROP TYPE "ShipmentJobStatus_old";
ALTER TABLE "ShipmentJob" ALTER COLUMN "status" SET DEFAULT 'CREATED';
COMMIT;

-- AlterTable
ALTER TABLE "DeliveryLeg" ADD COLUMN     "completedAt" TIMESTAMP(3),
ADD COLUMN     "deliveryId" TEXT,
ADD COLUMN     "fromHubId" TEXT,
ADD COLUMN     "handedOffAt" TIMESTAMP(3),
ADD COLUMN     "startedAt" TIMESTAMP(3),
ADD COLUMN     "toHubId" TEXT;

-- AlterTable
ALTER TABLE "ShipmentJob" DROP COLUMN "sourceType",
ADD COLUMN     "sourceType" "LogisticsSourceType" NOT NULL DEFAULT 'MANUAL';

-- CreateTable
CREATE TABLE "Delivery" (
    "id" TEXT NOT NULL,
    "orderId" TEXT,
    "shipmentId" TEXT,
    "requestId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Delivery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HandoffToken" (
    "id" TEXT NOT NULL,
    "legId" TEXT NOT NULL,
    "receiverUserId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HandoffToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Driver" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "driverType" "DriverType" NOT NULL DEFAULT 'VILLAGE_TO_CITY',
    "homeRegion" TEXT,
    "routeCorridor" TEXT,
    "vehicleType" TEXT,
    "capacityKg" DOUBLE PRECISION NOT NULL DEFAULT 0,

    CONSTRAINT "Driver_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DriverLocation" (
    "driverId" TEXT NOT NULL,
    "lat" DOUBLE PRECISION NOT NULL,
    "lng" DOUBLE PRECISION NOT NULL,
    "heading" DOUBLE PRECISION,
    "speed" DOUBLE PRECISION,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DriverLocation_pkey" PRIMARY KEY ("driverId")
);

-- CreateIndex
CREATE UNIQUE INDEX "Delivery_orderId_key" ON "Delivery"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "Delivery_shipmentId_key" ON "Delivery"("shipmentId");

-- CreateIndex
CREATE UNIQUE INDEX "Delivery_requestId_key" ON "Delivery"("requestId");

-- CreateIndex
CREATE UNIQUE INDEX "Driver_userId_key" ON "Driver"("userId");

-- AddForeignKey
ALTER TABLE "DeliveryLeg" ADD CONSTRAINT "DeliveryLeg_deliveryId_fkey" FOREIGN KEY ("deliveryId") REFERENCES "Delivery"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Delivery" ADD CONSTRAINT "Delivery_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Delivery" ADD CONSTRAINT "Delivery_shipmentId_fkey" FOREIGN KEY ("shipmentId") REFERENCES "ShipmentJob"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Delivery" ADD CONSTRAINT "Delivery_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "DeliveryRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HandoffToken" ADD CONSTRAINT "HandoffToken_legId_fkey" FOREIGN KEY ("legId") REFERENCES "DeliveryLeg"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HandoffToken" ADD CONSTRAINT "HandoffToken_receiverUserId_fkey" FOREIGN KEY ("receiverUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Driver" ADD CONSTRAINT "Driver_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DriverLocation" ADD CONSTRAINT "DriverLocation_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
