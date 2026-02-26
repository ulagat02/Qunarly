-- AlterTable
ALTER TABLE "DriverQueue" ADD COLUMN "expiresAt" TIMESTAMP(3), ADD COLUMN "lastPingAt" TIMESTAMP(3), ADD COLUMN "calledExpiresAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "QueueEvent" (
    "id" TEXT NOT NULL,
    "queueId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "metaJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QueueEvent_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "RideRequest" ADD COLUMN "clientRequestId" TEXT;

-- CreateTable
CREATE TABLE "OfferAcceptIdempotency" (
    "id" TEXT NOT NULL,
    "actionId" TEXT NOT NULL,
    "offerId" TEXT NOT NULL,
    "responseJson" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OfferAcceptIdempotency_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RideRequest_clientRequestId_key" ON "RideRequest"("clientRequestId");

-- CreateIndex
CREATE UNIQUE INDEX "OfferAcceptIdempotency_actionId_key" ON "OfferAcceptIdempotency"("actionId");

-- AddForeignKey
ALTER TABLE "QueueEvent" ADD CONSTRAINT "QueueEvent_queueId_fkey" FOREIGN KEY ("queueId") REFERENCES "DriverQueue"("id") ON DELETE CASCADE ON UPDATE CASCADE;
