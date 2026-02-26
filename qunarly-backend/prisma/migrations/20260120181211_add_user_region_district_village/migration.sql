-- AlterTable
ALTER TABLE "User" ADD COLUMN     "districtId" TEXT,
ADD COLUMN     "regionId" TEXT,
ADD COLUMN     "villageName" TEXT;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "Region"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_districtId_fkey" FOREIGN KEY ("districtId") REFERENCES "Region"("id") ON DELETE SET NULL ON UPDATE CASCADE;
