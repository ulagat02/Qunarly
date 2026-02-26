/*
  Warnings:

  - The values [OFFERED,ASSIGNED,ON_THE_WAY,COMPLETED,CANCELED] on the enum `RideRequestStatus` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `isActive` on the `TaxiRoute` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[fromVillageId,toVillageId,routeType]` on the table `TaxiRoute` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `cargoType` to the `RideRequest` table without a default value. This is not possible if the table is not empty.
  - Added the required column `departureType` to the `RideRequest` table without a default value. This is not possible if the table is not empty.
  - Made the column `pickupText` on table `RideRequest` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `routeType` to the `TaxiRoute` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "RouteStatus" AS ENUM ('INACTIVE', 'ACTIVE', 'PAUSED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "RouteType" AS ENUM ('VILLAGE_TO_DISTRICT', 'DISTRICT_TO_CITY', 'VILLAGE_TO_CITY');

-- CreateEnum
CREATE TYPE "DepartureType" AS ENUM ('TODAY', 'TOMORROW', 'SPECIFIC', 'FILL');

-- CreateEnum
CREATE TYPE "CargoType" AS ENUM ('NONE', 'SMALL', 'LARGE');

-- AlterEnum
BEGIN;
CREATE TYPE "RideRequestStatus_new" AS ENUM ('CREATED', 'WAITING_QUEUE', 'MATCHED', 'CONFIRMED', 'CANCELLED');
ALTER TABLE "RideRequest" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "RideRequest" ALTER COLUMN "status" TYPE "RideRequestStatus_new" USING ("status"::text::"RideRequestStatus_new");
ALTER TYPE "RideRequestStatus" RENAME TO "RideRequestStatus_old";
ALTER TYPE "RideRequestStatus_new" RENAME TO "RideRequestStatus";
DROP TYPE "RideRequestStatus_old";
ALTER TABLE "RideRequest" ALTER COLUMN "status" SET DEFAULT 'CREATED';
COMMIT;

-- DropIndex
DROP INDEX "TaxiRoute_fromVillageId_toVillageId_key";

-- AlterTable
ALTER TABLE "DriverQueue" ADD COLUMN     "availableSeats" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "RideRequest" ADD COLUMN     "cargoType" "CargoType" NOT NULL,
ADD COLUMN     "departureAt" TIMESTAMP(3),
ADD COLUMN     "departureType" "DepartureType" NOT NULL,
ALTER COLUMN "pickupText" SET NOT NULL;

-- AlterTable
ALTER TABLE "TaxiRoute" DROP COLUMN "isActive",
ADD COLUMN     "autoCreated" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "pairId" TEXT,
ADD COLUMN     "routeType" "RouteType" NOT NULL,
ADD COLUMN     "status" "RouteStatus" NOT NULL DEFAULT 'INACTIVE';

-- CreateIndex
CREATE UNIQUE INDEX "TaxiRoute_fromVillageId_toVillageId_routeType_key" ON "TaxiRoute"("fromVillageId", "toVillageId", "routeType");
