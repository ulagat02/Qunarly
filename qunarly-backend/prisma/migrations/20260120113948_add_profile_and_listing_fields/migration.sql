/*
  Warnings:

  - Added the required column `currency` to the `ProductListing` table without a default value. This is not possible if the table is not empty.
  - Added the required column `price` to the `ProductListing` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "FileEntityType" AS ENUM ('PROFILE_AVATAR', 'LISTING_IMAGE', 'OTHER');

-- AlterTable
ALTER TABLE "File" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "entityId" TEXT,
ADD COLUMN     "entityType" "FileEntityType";

-- AlterTable
ALTER TABLE "ProductListing" ADD COLUMN     "addressText" TEXT,
ADD COLUMN     "currency" TEXT NOT NULL,
ADD COLUMN     "price" DOUBLE PRECISION NOT NULL,
ALTER COLUMN "priceType" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Profile" ADD COLUMN     "avatarFileId" TEXT,
ADD COLUMN     "farmName" TEXT;

-- CreateTable
CREATE TABLE "ListingImage" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "fileId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ListingImage_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Profile" ADD CONSTRAINT "Profile_avatarFileId_fkey" FOREIGN KEY ("avatarFileId") REFERENCES "File"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ListingImage" ADD CONSTRAINT "ListingImage_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "ProductListing"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ListingImage" ADD CONSTRAINT "ListingImage_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "File"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
