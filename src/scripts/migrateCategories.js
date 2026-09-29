// server/src/scripts/migrateCategories.js
// JALANKAN SEKALI: node src/scripts/migrateCategories.js
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const slugify = (str) =>
  str.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

async function main() {
  console.log('🔄 Memulai migrasi kategori...\n');

  const packages = await prisma.package.findMany({ where: { categoryId: null } });
  const uniqueCategoryNames = [...new Set(packages.map(p => p.category).filter(Boolean))];

  console.log(`Ditemukan ${uniqueCategoryNames.length} kategori unik dari paket lama:`, uniqueCategoryNames);

  const categoryMap = {};
  for (const name of uniqueCategoryNames) {
    const slug = slugify(name);
    const category = await prisma.category.upsert({
      where: { slug },
      update: {},
      create: { name: name.charAt(0).toUpperCase() + name.slice(1), slug },
    });
    categoryMap[name] = category.id;
    console.log(`✅ Kategori dibuat/ditemukan: ${category.name} (id: ${category.id})`);
  }

  let updatedCount = 0;
  for (const pkg of packages) {
    if (pkg.category && categoryMap[pkg.category]) {
      await prisma.package.update({
        where: { id: pkg.id },
        data: { categoryId: categoryMap[pkg.category] },
      });
      updatedCount++;
    }
  }

  console.log(`\n🎉 Migrasi selesai. ${updatedCount} paket berhasil di-assign ke kategori baru.`);
}

main()
  .catch((e) => { console.error('❌ Error:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());