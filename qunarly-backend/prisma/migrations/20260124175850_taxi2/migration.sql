/*
  Warnings:

  - The values [SPECIFIC,FILL] on the enum `DepartureType` will be removed. If these variants are still used in the database, this will fail.
  - The values [CREATED,WAITING_QUEUE,MATCHED,CANCELLED] on the enum `RideRequestStatus` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `departureAt` on the `RideRequest` table. All the data in the column will be lost.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "DepartureType_new" AS ENUM ('TODAY', 'TOMORROW');
ALTER TABLE "RideRequest" ALTER COLUMN "departureType" TYPE "DepartureType_new" USING ("departureType"::text::"DepartureType_new");
ALTER TYPE "DepartureType" RENAME TO "DepartureType_old";
ALTER TYPE "DepartureType_new" RENAME TO "DepartureType";
DROP TYPE "DepartureType_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "RideRequestStatus_new" AS ENUM ('PENDING', 'CONFIRMED', 'CANCELLED_BY_PASSENGER', 'REMOVED_BY_DRIVER', 'NO_SHOW', 'EXPIRED');
ALTER TABLE "RideRequest" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "RideRequest" ALTER COLUMN "status" TYPE "RideRequestStatus_new" USING ("status"::text::"RideRequestStatus_new");
ALTER TYPE "RideRequestStatus" RENAME TO "RideRequestStatus_old";
ALTER TYPE "RideRequestStatus_new" RENAME TO "RideRequestStatus";
DROP TYPE "RideRequestStatus_old";
ALTER TABLE "RideRequest" ALTER COLUMN "status" SET DEFAULT 'PENDING';
COMMIT;

-- AlterTable
ALTER TABLE "DriverQueue" ADD COLUMN     "capacity" INTEGER NOT NULL DEFAULT 4,
ALTER COLUMN "availableSeats" SET DEFAULT 4;

-- AlterTable
ALTER TABLE "RideRequest" DROP COLUMN "departureAt",
ADD COLUMN     "waitUntilFull" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "status" SET DEFAULT 'PENDING';
