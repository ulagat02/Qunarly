-- Add new hub fields first
ALTER TABLE "Hub"
ADD COLUMN "districtId" TEXT,
ADD COLUMN "normalizedName" TEXT NOT NULL DEFAULT '',
ADD COLUMN "radiusKm" DOUBLE PRECISION NOT NULL DEFAULT 0.8,
ADD COLUMN "regionId" TEXT,
ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Backfill from existing data
UPDATE "Hub"
SET
  "normalizedName" = lower(trim("name")),
  "radiusKm" = COALESCE("radiusMeters", 800) / 1000.0;

-- Drop old column
ALTER TABLE "Hub" DROP COLUMN "radiusMeters";

-- Route enhancements
ALTER TABLE "TaxiRoute"
ADD COLUMN "label" TEXT,
ADD COLUMN "priority" INTEGER NOT NULL DEFAULT 0;

-- Indexes
CREATE INDEX "Hub_normalizedName_regionId_idx" ON "Hub"("normalizedName", "regionId");
CREATE INDEX "Hub_isActive_idx" ON "Hub"("isActive");

-- Relations
ALTER TABLE "Hub" ADD CONSTRAINT "Hub_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "Region"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Hub" ADD CONSTRAINT "Hub_districtId_fkey" FOREIGN KEY ("districtId") REFERENCES "District"("id") ON DELETE SET NULL ON UPDATE CASCADE;
