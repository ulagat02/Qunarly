/*
  Warnings:

  - You are about to drop the column `handedOffAt` on the `DeliveryLeg` table. All the data in the column will be lost.

*/
-- AlterEnum
ALTER TYPE "DriverQueueStatus" ADD VALUE 'REMOVED_INACTIVE';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "RideRequestStatus" ADD VALUE 'DRIVER_EN_ROUTE';
ALTER TYPE "RideRequestStatus" ADD VALUE 'IN_RIDE';
ALTER TYPE "RideRequestStatus" ADD VALUE 'COMPLETED';

-- AlterTable
ALTER TABLE "DeliveryLeg" DROP COLUMN "handedOffAt";
