-- CreateTable
CREATE TABLE "_PackageStudios" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_PackageStudios_AB_unique" ON "_PackageStudios"("A", "B");

-- CreateIndex
CREATE INDEX "_PackageStudios_B_index" ON "_PackageStudios"("B");

-- AddForeignKey
ALTER TABLE "_PackageStudios" ADD CONSTRAINT "_PackageStudios_A_fkey" FOREIGN KEY ("A") REFERENCES "Package"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PackageStudios" ADD CONSTRAINT "_PackageStudios_B_fkey" FOREIGN KEY ("B") REFERENCES "Studio"("id") ON DELETE CASCADE ON UPDATE CASCADE;
