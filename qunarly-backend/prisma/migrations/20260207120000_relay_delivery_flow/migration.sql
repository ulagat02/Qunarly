/*
  Warnings:

  - OrderStatus, DeliveryRequestStatus, and DeliveryLegStatus are reshaped. Existing values are mapped in-place.
*/

-- AlterEnum
BEGIN;
CREATE TYPE "OrderStatus_new" AS ENUM ('DRAFT', 'PLACED', 'IN_FULFILLMENT', 'DELIVERED', 'CLOSED', 'CANCELLED');
ALTER TABLE "Order" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Order" ALTER COLUMN "status" TYPE "OrderStatus_new" USING (
  CASE
    WHEN "status" = 'IN_DELIVERY' THEN 'IN_FULFILLMENT'
    WHEN "status" = 'PAID' THEN 'PLACED'
    ELSE "status"::text
  END
)::"OrderStatus_new";
ALTER TYPE "OrderStatus" RENAME TO "OrderStatus_old";
ALTER TYPE "OrderStatus_new" RENAME TO "OrderStatus";
DROP TYPE "OrderStatus_old";
ALTER TABLE "Order" ALTER COLUMN "status" SET DEFAULT 'PLACED';
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "DeliveryRequestStatus_new" AS ENUM ('CREATED', 'PACKED', 'LEG1', 'HUB', 'LEG2', 'CITY_HUB', 'LEG3', 'DELIVERED', 'CANCELLED');
ALTER TABLE "DeliveryRequest" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "DeliveryRequest" ALTER COLUMN "status" TYPE "DeliveryRequestStatus_new" USING (
  CASE
    WHEN "status" = 'IN_PROGRESS' THEN 'LEG1'
    WHEN "status" = 'COMPLETED' THEN 'DELIVERED'
    ELSE "status"::text
  END
)::"DeliveryRequestStatus_new";
ALTER TYPE "DeliveryRequestStatus" RENAME TO "DeliveryRequestStatus_old";
ALTER TYPE "DeliveryRequestStatus_new" RENAME TO "DeliveryRequestStatus";
DROP TYPE "DeliveryRequestStatus_old";
ALTER TABLE "DeliveryRequest" ALTER COLUMN "status" SET DEFAULT 'CREATED';
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "DeliveryLegStatus_new" AS ENUM ('OFFERING', 'ACCEPTED', 'STARTED', 'ARRIVED', 'COMPLETED');
ALTER TABLE "DeliveryLeg" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "DeliveryLeg" ALTER COLUMN "status" TYPE "DeliveryLegStatus_new" USING (
  CASE
    WHEN "status" = 'PENDING' THEN 'OFFERING'
    WHEN "status" = 'IN_PROGRESS' THEN 'STARTED'
    WHEN "status" = 'HANDED_OFF' THEN 'COMPLETED'
    ELSE "status"::text
  END
)::"DeliveryLegStatus_new";
ALTER TYPE "DeliveryLegStatus" RENAME TO "DeliveryLegStatus_old";
ALTER TYPE "DeliveryLegStatus_new" RENAME TO "DeliveryLegStatus";
DROP TYPE "DeliveryLegStatus_old";
ALTER TABLE "DeliveryLeg" ALTER COLUMN "status" SET DEFAULT 'OFFERING';
COMMIT;

-- AlterEnum
ALTER TYPE "FileEntityType" ADD VALUE IF NOT EXISTS 'DROP_PICK_DROP_PHOTO';
ALTER TYPE "FileEntityType" ADD VALUE IF NOT EXISTS 'DROP_PICK_PICKUP_PHOTO';

-- CreateEnum
CREATE TYPE "HandoffMethod" AS ENUM ('LIVE', 'DROP_PICK');

-- CreateEnum
CREATE TYPE "HandoffStatus" AS ENUM ('PENDING', 'FROM_CONFIRMED', 'TO_CONFIRMED', 'COMPLETED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "DropPickStatus" AS ENUM ('DROPPED', 'PICKED_UP', 'EXPIRED');

-- CreateEnum
CREATE TYPE "ProofEventType" AS ENUM ('LEG_OFFERED', 'LEG_ACCEPTED', 'LEG_STARTED', 'LEG_ARRIVED', 'HANDOFF_FROM_CONFIRMED', 'HANDOFF_TO_CONFIRMED', 'HANDOFF_COMPLETED', 'DROP_PICK_DROPPED', 'DROP_PICK_PICKED_UP', 'LEG_COMPLETED');

-- CreateEnum
CREATE TYPE "ProofEntityType" AS ENUM ('ORDER', 'DELIVERY', 'REQUEST', 'LEG', 'HANDOFF', 'DROP_PICK');

-- AlterTable
ALTER TABLE "DeliveryLeg" ADD COLUMN     "acceptedAt" TIMESTAMP(3),
ADD COLUMN     "arrivedAt" TIMESTAMP(3),
ADD COLUMN     "arrivedLat" DOUBLE PRECISION,
ADD COLUMN     "arrivedLng" DOUBLE PRECISION,
ADD COLUMN     "arrivedHubId" TEXT;

-- CreateTable
CREATE TABLE "Handoff" (
    "id" TEXT NOT NULL,
    "fromLegId" TEXT NOT NULL,
    "toLegId" TEXT NOT NULL,
    "method" "HandoffMethod" NOT NULL DEFAULT 'LIVE',
    "status" "HandoffStatus" NOT NULL DEFAULT 'PENDING',
    "senderLat" DOUBLE PRECISION,
    "senderLng" DOUBLE PRECISION,
    "receiverLat" DOUBLE PRECISION,
    "receiverLng" DOUBLE PRECISION,
    "fromConfirmedAt" TIMESTAMP(3),
    "toConfirmedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Handoff_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DropPick" (
    "id" TEXT NOT NULL,
    "handoffId" TEXT NOT NULL,
    "status" "DropPickStatus" NOT NULL DEFAULT 'DROPPED',
    "droppedById" TEXT NOT NULL,
    "droppedAt" TIMESTAMP(3) NOT NULL,
    "dropLat" DOUBLE PRECISION NOT NULL,
    "dropLng" DOUBLE PRECISION NOT NULL,
    "dropPhoto1Id" TEXT NOT NULL,
    "dropPhoto2Id" TEXT NOT NULL,
    "pickupTokenHash" TEXT NOT NULL,
    "pickupExpiresAt" TIMESTAMP(3) NOT NULL,
    "pickupById" TEXT,
    "pickupAt" TIMESTAMP(3),
    "pickupLat" DOUBLE PRECISION,
    "pickupLng" DOUBLE PRECISION,
    "pickupPhoto1Id" TEXT,
    "pickupPhoto2Id" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DropPick_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProofEvent" (
    "id" TEXT NOT NULL,
    "eventKey" TEXT,
    "eventType" "ProofEventType" NOT NULL,
    "entityType" "ProofEntityType" NOT NULL,
    "entityId" TEXT NOT NULL,
    "actorUserId" TEXT,
    "orderId" TEXT,
    "deliveryId" TEXT,
    "requestId" TEXT,
    "legId" TEXT,
    "handoffId" TEXT,
    "dropPickId" TEXT,
    "lat" DOUBLE PRECISION,
    "lng" DOUBLE PRECISION,
    "clientCreatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metaJson" JSONB,

    CONSTRAINT "ProofEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Handoff_fromLegId_key" ON "Handoff"("fromLegId");

-- CreateIndex
CREATE UNIQUE INDEX "Handoff_toLegId_key" ON "Handoff"("toLegId");

-- CreateIndex
CREATE UNIQUE INDEX "DropPick_handoffId_key" ON "DropPick"("handoffId");

-- CreateIndex
CREATE UNIQUE INDEX "ProofEvent_eventKey_key" ON "ProofEvent"("eventKey");

-- AddForeignKey
ALTER TABLE "DeliveryLeg" ADD CONSTRAINT "DeliveryLeg_arrivedHubId_fkey" FOREIGN KEY ("arrivedHubId") REFERENCES "Hub"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Handoff" ADD CONSTRAINT "Handoff_fromLegId_fkey" FOREIGN KEY ("fromLegId") REFERENCES "DeliveryLeg"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Handoff" ADD CONSTRAINT "Handoff_toLegId_fkey" FOREIGN KEY ("toLegId") REFERENCES "DeliveryLeg"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DropPick" ADD CONSTRAINT "DropPick_handoffId_fkey" FOREIGN KEY ("handoffId") REFERENCES "Handoff"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DropPick" ADD CONSTRAINT "DropPick_droppedById_fkey" FOREIGN KEY ("droppedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DropPick" ADD CONSTRAINT "DropPick_pickupById_fkey" FOREIGN KEY ("pickupById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DropPick" ADD CONSTRAINT "DropPick_dropPhoto1Id_fkey" FOREIGN KEY ("dropPhoto1Id") REFERENCES "File"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DropPick" ADD CONSTRAINT "DropPick_dropPhoto2Id_fkey" FOREIGN KEY ("dropPhoto2Id") REFERENCES "File"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DropPick" ADD CONSTRAINT "DropPick_pickupPhoto1Id_fkey" FOREIGN KEY ("pickupPhoto1Id") REFERENCES "File"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DropPick" ADD CONSTRAINT "DropPick_pickupPhoto2Id_fkey" FOREIGN KEY ("pickupPhoto2Id") REFERENCES "File"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProofEvent" ADD CONSTRAINT "ProofEvent_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProofEvent" ADD CONSTRAINT "ProofEvent_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProofEvent" ADD CONSTRAINT "ProofEvent_deliveryId_fkey" FOREIGN KEY ("deliveryId") REFERENCES "Delivery"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProofEvent" ADD CONSTRAINT "ProofEvent_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "DeliveryRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProofEvent" ADD CONSTRAINT "ProofEvent_legId_fkey" FOREIGN KEY ("legId") REFERENCES "DeliveryLeg"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProofEvent" ADD CONSTRAINT "ProofEvent_handoffId_fkey" FOREIGN KEY ("handoffId") REFERENCES "Handoff"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProofEvent" ADD CONSTRAINT "ProofEvent_dropPickId_fkey" FOREIGN KEY ("dropPickId") REFERENCES "DropPick"("id") ON DELETE SET NULL ON UPDATE CASCADE;
