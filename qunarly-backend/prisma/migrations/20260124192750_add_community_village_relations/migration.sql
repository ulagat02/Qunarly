-- AlterTable
ALTER TABLE "CommunityVillage" ALTER COLUMN "status" SET DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "TaxiRoute" ADD COLUMN     "createdByUserId" TEXT;

-- AddForeignKey
ALTER TABLE "TaxiRoute" ADD CONSTRAINT "TaxiRoute_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
