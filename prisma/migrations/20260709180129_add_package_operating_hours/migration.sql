-- AlterTable
ALTER TABLE "Package" ADD COLUMN     "operatingEndTime" TEXT NOT NULL DEFAULT '17:00',
ADD COLUMN     "operatingStartTime" TEXT NOT NULL DEFAULT '08:00';
