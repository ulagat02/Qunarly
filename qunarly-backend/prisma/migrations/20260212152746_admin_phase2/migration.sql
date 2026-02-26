/*
  Warnings:

  - You are about to drop the column `deliveryRate` on the `CommissionConfig` table. All the data in the column will be lost.
  - You are about to drop the column `endsAt` on the `CommissionConfig` table. All the data in the column will be lost.
  - You are about to drop the column `productRate` on the `CommissionConfig` table. All the data in the column will be lost.
  - You are about to drop the column `scopeRef` on the `CommissionConfig` table. All the data in the column will be lost.
  - You are about to drop the column `startsAt` on the `CommissionConfig` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `CommissionConfig` table. All the data in the column will be lost.
  - You are about to drop the column `refundFlag` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the column `refundMarkedAt` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the column `refundMarkedById` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the column `refundReason` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the `AdminAlertConfig` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `BlacklistEntry` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `DeliveryLegSla` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Dispute` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `RateLimitRule` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `WhitelistEntry` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `deliveryRatePercent` to the `CommissionConfig` table without a default value. This is not possible if the table is not empty.
  - Added the required column `effectiveFrom` to the `CommissionConfig` table without a default value. This is not possible if the table is not empty.
  - Added the required column `productRatePercent` to the `CommissionConfig` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "DisputeResolution" AS ENUM ('REFUND_REQUESTED', 'REFUND_DENIED', 'ORDER_CANCELLED', 'ORDER_CONTINUE');

-- CreateEnum
CREATE TYPE "AccessListType" AS ENUM ('BLACKLIST', 'WHITELIST');

-- CreateEnum
CREATE TYPE "AccessListTarget" AS ENUM ('USER_ID', 'PHONE', 'EMAIL', 'DEVICE_ID', 'IP_HASH');

-- DropForeignKey
ALTER TABLE "Dispute" DROP CONSTRAINT "Dispute_openedById_fkey";

-- DropForeignKey
ALTER TABLE "Dispute" DROP CONSTRAINT "Dispute_orderId_fkey";

-- DropForeignKey
ALTER TABLE "Dispute" DROP CONSTRAINT "Dispute_resolvedById_fkey";

-- DropForeignKey
ALTER TABLE "Order" DROP CONSTRAINT "Order_refundMarkedById_fkey";

-- DropIndex
DROP INDEX "CommissionConfig_isActive_idx";

-- DropIndex
DROP INDEX "CommissionConfig_scope_scopeRef_idx";

-- AlterTable
ALTER TABLE "CommissionConfig" DROP COLUMN "deliveryRate",
DROP COLUMN "endsAt",
DROP COLUMN "productRate",
DROP COLUMN "scopeRef",
DROP COLUMN "startsAt",
DROP COLUMN "updatedAt",
ADD COLUMN     "category" TEXT,
ADD COLUMN     "createdByUserId" TEXT,
ADD COLUMN     "deliveryRatePercent" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "effectiveFrom" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "effectiveTo" TIMESTAMP(3),
ADD COLUMN     "productRatePercent" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "regionId" TEXT,
ALTER COLUMN "scope" SET DEFAULT 'GLOBAL';

-- AlterTable
ALTER TABLE "Order" DROP COLUMN "refundFlag",
DROP COLUMN "refundMarkedAt",
DROP COLUMN "refundMarkedById",
DROP COLUMN "refundReason";

-- DropTable
DROP TABLE "AdminAlertConfig";

-- DropTable
DROP TABLE "BlacklistEntry";

-- DropTable
DROP TABLE "DeliveryLegSla";

-- DropTable
DROP TABLE "Dispute";

-- DropTable
DROP TABLE "RateLimitRule";

-- DropTable
DROP TABLE "WhitelistEntry";

-- DropEnum
DROP TYPE "DisputeResolutionType";

-- DropEnum
DROP TYPE "ListEntryType";

-- CreateTable
CREATE TABLE "OrderDispute" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "status" "DisputeStatus" NOT NULL DEFAULT 'OPEN',
    "reason" TEXT NOT NULL,
    "resolution" "DisputeResolution",
    "resolutionNote" TEXT,
    "openedByUserId" TEXT,
    "closedByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closedAt" TIMESTAMP(3),

    CONSTRAINT "OrderDispute_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RefundFlag" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "createdByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RefundFlag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeliverySlaConfig" (
    "id" TEXT NOT NULL,
    "legSortOrder" INTEGER NOT NULL,
    "minutes" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DeliverySlaConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AccessListEntry" (
    "id" TEXT NOT NULL,
    "listType" "AccessListType" NOT NULL,
    "targetType" "AccessListTarget" NOT NULL,
    "targetValue" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "createdByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AccessListEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RateLimitPolicy" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "limit" INTEGER NOT NULL,
    "windowSeconds" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RateLimitPolicy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AlertConfig" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "threshold" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AlertConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IncidentPlaybook" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "stepsMarkdown" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IncidentPlaybook_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OrderDispute_orderId_idx" ON "OrderDispute"("orderId");

-- CreateIndex
CREATE INDEX "OrderDispute_status_idx" ON "OrderDispute"("status");

-- CreateIndex
CREATE INDEX "RefundFlag_orderId_idx" ON "RefundFlag"("orderId");

-- CreateIndex
CREATE INDEX "DeliverySlaConfig_legSortOrder_isActive_idx" ON "DeliverySlaConfig"("legSortOrder", "isActive");

-- CreateIndex
CREATE INDEX "AccessListEntry_listType_targetType_idx" ON "AccessListEntry"("listType", "targetType");

-- CreateIndex
CREATE UNIQUE INDEX "AccessListEntry_listType_targetType_targetValue_key" ON "AccessListEntry"("listType", "targetType", "targetValue");

-- CreateIndex
CREATE INDEX "RateLimitPolicy_key_isActive_idx" ON "RateLimitPolicy"("key", "isActive");

-- CreateIndex
CREATE INDEX "AlertConfig_key_isActive_idx" ON "AlertConfig"("key", "isActive");

-- CreateIndex
CREATE INDEX "IncidentPlaybook_key_isActive_idx" ON "IncidentPlaybook"("key", "isActive");

-- CreateIndex
CREATE INDEX "CommissionConfig_scope_isActive_idx" ON "CommissionConfig"("scope", "isActive");

-- CreateIndex
CREATE INDEX "CommissionConfig_regionId_idx" ON "CommissionConfig"("regionId");

-- CreateIndex
CREATE INDEX "CommissionConfig_category_idx" ON "CommissionConfig"("category");

-- AddForeignKey
ALTER TABLE "OrderDispute" ADD CONSTRAINT "OrderDispute_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderDispute" ADD CONSTRAINT "OrderDispute_openedByUserId_fkey" FOREIGN KEY ("openedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderDispute" ADD CONSTRAINT "OrderDispute_closedByUserId_fkey" FOREIGN KEY ("closedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RefundFlag" ADD CONSTRAINT "RefundFlag_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RefundFlag" ADD CONSTRAINT "RefundFlag_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeliverySlaConfig" ADD CONSTRAINT "DeliverySlaConfig_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommissionConfig" ADD CONSTRAINT "CommissionConfig_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccessListEntry" ADD CONSTRAINT "AccessListEntry_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RateLimitPolicy" ADD CONSTRAINT "RateLimitPolicy_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AlertConfig" ADD CONSTRAINT "AlertConfig_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IncidentPlaybook" ADD CONSTRAINT "IncidentPlaybook_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
