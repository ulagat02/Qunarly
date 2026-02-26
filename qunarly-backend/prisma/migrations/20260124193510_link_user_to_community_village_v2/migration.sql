-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_settlementId_fkey";

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_settlementId_fkey" FOREIGN KEY ("settlementId") REFERENCES "CommunityVillage"("id") ON DELETE SET NULL ON UPDATE CASCADE;
