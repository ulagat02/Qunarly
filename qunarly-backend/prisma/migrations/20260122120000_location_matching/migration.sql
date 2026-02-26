-- User home location
ALTER TABLE "User"
ADD COLUMN "homeLat" DOUBLE PRECISION,
ADD COLUMN "homeLng" DOUBLE PRECISION,
ADD COLUMN "homeAddressText" TEXT,
ADD COLUMN "homeRegion" TEXT,
ADD COLUMN "homeUpdatedAt" TIMESTAMP(3);

-- Deal cargo + locations
ALTER TABLE "Deal"
ADD COLUMN "cargoWeightKg" DOUBLE PRECISION,
ADD COLUMN "cargoVolumeM3" DOUBLE PRECISION,
ADD COLUMN "cargoType" TEXT,
ADD COLUMN "pickupLat" DOUBLE PRECISION,
ADD COLUMN "pickupLng" DOUBLE PRECISION,
ADD COLUMN "pickupAddressText" TEXT,
ADD COLUMN "dropoffLat" DOUBLE PRECISION,
ADD COLUMN "dropoffLng" DOUBLE PRECISION,
ADD COLUMN "dropoffAddressText" TEXT;

-- Field job cargo + address
ALTER TABLE "FieldJob"
ADD COLUMN "pickupAddressText" TEXT,
ADD COLUMN "cargoWeightKg" DOUBLE PRECISION,
ADD COLUMN "cargoVolumeM3" DOUBLE PRECISION,
ADD COLUMN "cargoType" TEXT;

-- Carrier profile capacity/flags
ALTER TABLE "CarrierProfile"
ADD COLUMN "maxWeightKg" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN "maxVolumeM3" DOUBLE PRECISION,
ADD COLUMN "vehicleType" TEXT,
ADD COLUMN "refrigerated" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "livestock" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "closedBody" BOOLEAN NOT NULL DEFAULT false;

-- Shipment job cargo + address
ALTER TABLE "ShipmentJob"
ADD COLUMN "originAddressText" TEXT,
ADD COLUMN "destAddressText" TEXT,
ADD COLUMN "cargoWeightKg" DOUBLE PRECISION,
ADD COLUMN "cargoVolumeM3" DOUBLE PRECISION,
ADD COLUMN "cargoType" TEXT;
