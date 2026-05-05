-- DropForeignKey
ALTER TABLE "PackageBackground" DROP CONSTRAINT "PackageBackground_packageId_fkey";

-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "photoPickupBy" TEXT,
ADD COLUMN     "photoPickupDate" TIMESTAMP(3),
ADD COLUMN     "photoPickupNotes" TEXT,
ADD COLUMN     "photoPickupStatus" TEXT DEFAULT 'belum_diambil';

-- AddForeignKey
ALTER TABLE "PackageBackground" ADD CONSTRAINT "PackageBackground_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "Package"("id") ON DELETE CASCADE ON UPDATE CASCADE;
