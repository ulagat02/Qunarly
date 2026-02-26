-- CreateEnum
CREATE TYPE "DisputeStatus" AS ENUM ('OPEN', 'RESOLVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "DisputeResolutionType" AS ENUM ('REFUND_REQUESTED', 'REFUND_DECLINED', 'COMPENSATION', 'OTHER');

-- CreateEnum
CREATE TYPE "ListEntryType" AS ENUM ('EMAIL', 'PHONE', 'USER_ID', 'DEVICE_ID', 'IP_HASH');

-- CreateEnum
CREATE TYPE "CommissionScope" AS ENUM ('GLOBAL', 'CATEGORY', 'REGION');

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "refundFlag" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "refundMarkedAt" TIMESTAMP(3),
ADD COLUMN     "refundMarkedById" TEXT,
ADD COLUMN     "refundReason" TEXT;

-- CreateTable
CREATE TABLE "CommissionConfig" (
    "id" TEXT NOT NULL,
    "scope" "CommissionScope" NOT NULL,
    "scopeRef" TEXT,
    "productRate" DOUBLE PRECISION NOT NULL,
    "deliveryRate" DOUBLE PRECISION NOT NULL,
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CommissionConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Dispute" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "status" "DisputeStatus" NOT NULL DEFAULT 'OPEN',
    "resolutionType" "DisputeResolutionType",
    "reason" TEXT NOT NULL,
    "resolutionNote" TEXT,
    "openedById" TEXT,
    "resolvedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Dispute_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeliveryLegSla" (
    "id" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL,
    "maxMinutes" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DeliveryLegSla_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BlacklistEntry" (
    "id" TEXT NOT NULL,
    "type" "ListEntryType" NOT NULL,
    "value" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BlacklistEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WhitelistEntry" (
    "id" TEXT NOT NULL,
    "type" "ListEntryType" NOT NULL,
    "value" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WhitelistEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RateLimitRule" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "limit" INTEGER NOT NULL,
    "windowSeconds" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RateLimitRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminAlertConfig" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdminAlertConfig_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CommissionConfig_scope_scopeRef_idx" ON "CommissionConfig"("scope", "scopeRef");

-- CreateIndex
CREATE INDEX "CommissionConfig_isActive_idx" ON "CommissionConfig"("isActive");

-- CreateIndex
CREATE INDEX "Dispute_orderId_idx" ON "Dispute"("orderId");

-- CreateIndex
CREATE INDEX "Dispute_status_idx" ON "Dispute"("status");

-- CreateIndex
CREATE UNIQUE INDEX "DeliveryLegSla_sortOrder_key" ON "DeliveryLegSla"("sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "BlacklistEntry_type_value_key" ON "BlacklistEntry"("type", "value");

-- CreateIndex
CREATE UNIQUE INDEX "WhitelistEntry_type_value_key" ON "WhitelistEntry"("type", "value");

-- CreateIndex
CREATE UNIQUE INDEX "RateLimitRule_key_key" ON "RateLimitRule"("key");

-- CreateIndex
CREATE UNIQUE INDEX "AdminAlertConfig_key_key" ON "AdminAlertConfig"("key");

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_refundMarkedById_fkey" FOREIGN KEY ("refundMarkedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Dispute" ADD CONSTRAINT "Dispute_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Dispute" ADD CONSTRAINT "Dispute_openedById_fkey" FOREIGN KEY ("openedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Dispute" ADD CONSTRAINT "Dispute_resolvedById_fkey" FOREIGN KEY ("resolvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
