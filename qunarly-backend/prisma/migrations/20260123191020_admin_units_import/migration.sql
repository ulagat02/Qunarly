/*
  Warnings:

  - A unique constraint covering the columns `[name,parentId]` on the table `Region` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "TaxiRouteKind" AS ENUM ('SETTLEMENT_TO_DISTRICT_CENTER', 'DISTRICT_CENTER_TO_CITY');

-- CreateTable
CREATE TABLE "District" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "regionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "District_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Settlement" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "districtId" TEXT NOT NULL,
    "isCenter" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Settlement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaxiRoute" (
    "id" TEXT NOT NULL,
    "fromSettlementId" TEXT NOT NULL,
    "toSettlementId" TEXT NOT NULL,
    "kind" "TaxiRouteKind" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TaxiRoute_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "District_name_regionId_key" ON "District"("name", "regionId");

-- CreateIndex
CREATE UNIQUE INDEX "Settlement_name_districtId_key" ON "Settlement"("name", "districtId");

-- CreateIndex
CREATE UNIQUE INDEX "TaxiRoute_fromSettlementId_toSettlementId_kind_key" ON "TaxiRoute"("fromSettlementId", "toSettlementId", "kind");

-- CreateIndex
CREATE UNIQUE INDEX "Region_name_parentId_key" ON "Region"("name", "parentId");

-- AddForeignKey
ALTER TABLE "District" ADD CONSTRAINT "District_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "Region"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Settlement" ADD CONSTRAINT "Settlement_districtId_fkey" FOREIGN KEY ("districtId") REFERENCES "District"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaxiRoute" ADD CONSTRAINT "TaxiRoute_fromSettlementId_fkey" FOREIGN KEY ("fromSettlementId") REFERENCES "Settlement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaxiRoute" ADD CONSTRAINT "TaxiRoute_toSettlementId_fkey" FOREIGN KEY ("toSettlementId") REFERENCES "Settlement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
