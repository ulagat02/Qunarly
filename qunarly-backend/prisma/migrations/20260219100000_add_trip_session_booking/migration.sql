-- CreateEnum
CREATE TYPE "TripSessionStatus" AS ENUM ('OPEN', 'CLOSING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "TripBookingStatus" AS ENUM ('ACTIVE', 'CANCELLED', 'COMPLETED');

-- CreateTable
CREATE TABLE "TripSession" (
    "id" TEXT NOT NULL,
    "driverId" TEXT NOT NULL,
    "routeId" TEXT NOT NULL,
    "status" "TripSessionStatus" NOT NULL DEFAULT 'OPEN',
    "totalSeats" INTEGER NOT NULL,
    "bookedSeats" INTEGER NOT NULL DEFAULT 0,
    "expiresAt" TIMESTAMP(3),
    "closingUntil" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TripSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TripBooking" (
    "id" TEXT NOT NULL,
    "tripId" TEXT NOT NULL,
    "passengerId" TEXT NOT NULL,
    "seatCount" INTEGER NOT NULL,
    "status" "TripBookingStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TripBooking_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TripBooking_tripId_passengerId_key" ON "TripBooking"("tripId", "passengerId");

-- AddForeignKey
ALTER TABLE "TripSession" ADD CONSTRAINT "TripSession_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TripSession" ADD CONSTRAINT "TripSession_routeId_fkey" FOREIGN KEY ("routeId") REFERENCES "TaxiRoute"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TripBooking" ADD CONSTRAINT "TripBooking_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "TripSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TripBooking" ADD CONSTRAINT "TripBooking_passengerId_fkey" FOREIGN KEY ("passengerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
