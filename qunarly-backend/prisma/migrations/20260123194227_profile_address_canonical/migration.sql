-- AlterTable
ALTER TABLE "User" ADD COLUMN     "settlementId" TEXT;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_settlementId_fkey" FOREIGN KEY ("settlementId") REFERENCES "Settlement"("id") ON DELETE SET NULL ON UPDATE CASCADE;
