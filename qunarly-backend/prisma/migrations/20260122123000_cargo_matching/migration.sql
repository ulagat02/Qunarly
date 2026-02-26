-- Deal pickup/dropoff region
ALTER TABLE "Deal"
ADD COLUMN "pickupRegion" TEXT,
ADD COLUMN "dropoffRegion" TEXT;

-- Shipment regions and cargo metadata
ALTER TABLE "ShipmentJob"
ADD COLUMN "originRegion" TEXT,
ADD COLUMN "destRegion" TEXT,
ADD COLUMN "packageType" TEXT,
ADD COLUMN "cargoNotes" TEXT;
