-- Add idempotency to orders
ALTER TABLE "Order" ADD COLUMN "idempotencyKey" TEXT;

CREATE UNIQUE INDEX "Order_buyerId_idempotencyKey_key"
ON "Order"("buyerId", "idempotencyKey");

-- Track delivery leg updates for timeout checks
ALTER TABLE "DeliveryLeg"
ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
