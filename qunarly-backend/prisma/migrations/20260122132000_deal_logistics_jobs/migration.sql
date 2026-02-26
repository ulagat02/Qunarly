-- Shipment job source tracking
ALTER TABLE "ShipmentJob"
ADD COLUMN "sourceType" TEXT NOT NULL DEFAULT 'MANUAL',
ADD COLUMN "sourceId" TEXT;

-- Update shipment status enum values (manual SQL for Postgres enum)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ShipmentJobStatus') THEN
    ALTER TYPE "ShipmentJobStatus" ADD VALUE IF NOT EXISTS 'ASSIGNED';
    ALTER TYPE "ShipmentJobStatus" ADD VALUE IF NOT EXISTS 'PICKED_UP';
  END IF;
END $$;

