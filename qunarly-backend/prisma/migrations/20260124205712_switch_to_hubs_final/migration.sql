/*
  Warnings:

  - You are about to drop the column `fromVillageId` on the `TaxiRoute` table. All the data in the column will be lost.
  - You are about to drop the column `toVillageId` on the `TaxiRoute` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[fromHubId,toHubId,routeType]` on the table `TaxiRoute` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `fromHubId` to the `TaxiRoute` table without a default value. This is not possible if the table is not empty.
  - Added the required column `toHubId` to the `TaxiRoute` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "TaxiRoute" DROP CONSTRAINT "TaxiRoute_fromVillageId_fkey";

-- DropForeignKey
ALTER TABLE "TaxiRoute" DROP CONSTRAINT "TaxiRoute_toVillageId_fkey";

-- DropIndex
DROP INDEX "TaxiRoute_fromVillageId_toVillageId_routeType_key";

-- AlterTable
ALTER TABLE "TaxiRoute" DROP COLUMN "fromVillageId",
DROP COLUMN "toVillageId",
ADD COLUMN     "fromHubId" TEXT NOT NULL,
ADD COLUMN     "toHubId" TEXT NOT NULL,
ALTER COLUMN "routeType" SET DEFAULT 'VILLAGE_TO_DISTRICT';

-- CreateIndex
CREATE UNIQUE INDEX "TaxiRoute_fromHubId_toHubId_routeType_key" ON "TaxiRoute"("fromHubId", "toHubId", "routeType");

-- AddForeignKey
ALTER TABLE "TaxiRoute" ADD CONSTRAINT "TaxiRoute_fromHubId_fkey" FOREIGN KEY ("fromHubId") REFERENCES "Hub"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaxiRoute" ADD CONSTRAINT "TaxiRoute_toHubId_fkey" FOREIGN KEY ("toHubId") REFERENCES "Hub"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
