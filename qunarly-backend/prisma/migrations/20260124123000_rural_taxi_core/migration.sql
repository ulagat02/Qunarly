/*
  Warnings:

  - This migration drops tables Settlement and TaxiRoute and replaces them with CommunityVillage and new TaxiRoute.
*/
-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT IF EXISTS "User_settlementId_fkey";
ALTER TABLE "User" DROP CONSTRAINT IF EXISTS "User_districtId_fkey";

-- DropTable
DROP TABLE IF EXISTS "DriverQueue";
DROP TABLE IF EXISTS "DriverOffer";
DROP TABLE IF EXISTS "RideRequest";
DROP TABLE IF EXISTS "TaxiRoute";
DROP TABLE IF EXISTS "Settlement";

-- DropEnum
DROP TYPE IF EXISTS "TaxiRouteKind";

-- CreateEnum
CREATE TYPE "CommunityVillageStatus" AS ENUM ('ACTIVE', 'PENDING', 'REJECTED');

-- CreateEnum
CREATE TYPE "DriverQueueStatus" AS ENUM ('IN_QUEUE', 'OFFERED', 'ON_TRIP', 'OFFLINE');

-- CreateEnum
CREATE TYPE "RideRequestStatus" AS ENUM ('CREATED', 'OFFERED', 'ASSIGNED', 'ON_THE_WAY', 'COMPLETED', 'CANCELED');

-- CreateEnum
CREATE TYPE "DriverOfferStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'EXPIRED');

-- AlterTable
ALTER TABLE "User" DROP COLUMN IF EXISTS "villageName";

-- CreateTable
CREATE TABLE "CommunityVillage" (
    "id" TEXT NOT NULL,
    "nameDisplay" TEXT NOT NULL,
    "nameNormalized" TEXT NOT NULL,
    "districtId" TEXT NOT NULL,
    "regionId" TEXT NOT NULL,
    "lat" DOUBLE PRECISION NOT NULL,
    "lng" DOUBLE PRECISION NOT NULL,
    "status" "CommunityVillageStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CommunityVillage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaxiRoute" (
    "id" TEXT NOT NULL,
    "fromVillageId" TEXT NOT NULL,
    "toVillageId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TaxiRoute_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DriverQueue" (
    "id" TEXT NOT NULL,
    "driverId" TEXT NOT NULL,
    "routeId" TEXT NOT NULL,
    "status" "DriverQueueStatus" NOT NULL DEFAULT 'IN_QUEUE',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DriverQueue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RideRequest" (
    "id" TEXT NOT NULL,
    "routeId" TEXT NOT NULL,
    "passengerId" TEXT NOT NULL,
    "pickupText" TEXT,
    "seats" INTEGER NOT NULL DEFAULT 1,
    "status" "RideRequestStatus" NOT NULL DEFAULT 'CREATED',
    "assignedDriverId" TEXT,
    "currentOfferId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RideRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DriverOffer" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "driverId" TEXT NOT NULL,
    "routeId" TEXT NOT NULL,
    "status" "DriverOfferStatus" NOT NULL DEFAULT 'PENDING',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DriverOffer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CommunityVillage_nameNormalized_districtId_key" ON "CommunityVillage"("nameNormalized", "districtId");

-- CreateIndex
CREATE UNIQUE INDEX "TaxiRoute_fromVillageId_toVillageId_key" ON "TaxiRoute"("fromVillageId", "toVillageId");

-- CreateIndex
CREATE UNIQUE INDEX "DriverQueue_driverId_routeId_key" ON "DriverQueue"("driverId", "routeId");

-- CreateIndex
CREATE UNIQUE INDEX "DriverOffer_requestId_driverId_key" ON "DriverOffer"("requestId", "driverId");

-- AddForeignKey
ALTER TABLE "CommunityVillage" ADD CONSTRAINT "CommunityVillage_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "Region"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunityVillage" ADD CONSTRAINT "CommunityVillage_districtId_fkey" FOREIGN KEY ("districtId") REFERENCES "District"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunityVillage" ADD CONSTRAINT "CommunityVillage_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaxiRoute" ADD CONSTRAINT "TaxiRoute_fromVillageId_fkey" FOREIGN KEY ("fromVillageId") REFERENCES "CommunityVillage"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaxiRoute" ADD CONSTRAINT "TaxiRoute_toVillageId_fkey" FOREIGN KEY ("toVillageId") REFERENCES "CommunityVillage"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DriverQueue" ADD CONSTRAINT "DriverQueue_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DriverQueue" ADD CONSTRAINT "DriverQueue_routeId_fkey" FOREIGN KEY ("routeId") REFERENCES "TaxiRoute"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RideRequest" ADD CONSTRAINT "RideRequest_routeId_fkey" FOREIGN KEY ("routeId") REFERENCES "TaxiRoute"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RideRequest" ADD CONSTRAINT "RideRequest_passengerId_fkey" FOREIGN KEY ("passengerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RideRequest" ADD CONSTRAINT "RideRequest_assignedDriverId_fkey" FOREIGN KEY ("assignedDriverId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DriverOffer" ADD CONSTRAINT "DriverOffer_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "RideRequest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DriverOffer" ADD CONSTRAINT "DriverOffer_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DriverOffer" ADD CONSTRAINT "DriverOffer_routeId_fkey" FOREIGN KEY ("routeId") REFERENCES "TaxiRoute"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_settlementId_fkey" FOREIGN KEY ("settlementId") REFERENCES "CommunityVillage"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Clean up invalid district references before adding FK
UPDATE "User"
SET "districtId" = NULL
WHERE "districtId" IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM "District"
    WHERE "District"."id" = "User"."districtId"
  );

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_districtId_fkey" FOREIGN KEY ("districtId") REFERENCES "District"("id") ON DELETE SET NULL ON UPDATE CASCADE;
