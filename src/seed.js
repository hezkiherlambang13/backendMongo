// server/src/seed.js
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
dotenv.config();

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database Studio Bion...\n');

  // ===== ADMIN =====
  const adminPass = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@studiobion.com' },
    update: {},
    create: { name: 'Admin Studio Bion', email: 'admin@studiobion.com', password: adminPass, role: 'admin', phone: '6281000000001' },
  });
  console.log('✅ Admin:', admin.email);

  // ===== MANAGER =====
  const managerPass = await bcrypt.hash('manager123', 10);
  const manager = await prisma.user.upsert({
    where: { email: 'manager@studiobion.com' },
    update: {},
    create: { name: 'Manager Studio Bion', email: 'manager@studiobion.com', password: managerPass, role: 'manager', phone: '6281000000002' },
  });
  console.log('✅ Manager:', manager.email);

  // ===== STUDIO (✅ FIX: ditambahkan, sebelumnya belum ada) =====
  const studio1 = await prisma.studio.upsert({
    where: { key: 'studio1' },
    update: {},
    create: { key: 'studio1', name: 'Studio 1', isActive: true },
  });
  const studio2 = await prisma.studio.upsert({
    where: { key: 'studio2' },
    update: {},
    create: { key: 'studio2', name: 'Studio 2', isActive: true },
  });
  console.log('✅ Studio:', studio1.name, '&', studio2.name);

  // ===== SAMPLE PACKAGES =====
  // ✅ FIX: tidak pakai id string manual (id di Package adalah Int autoincrement),
  // pakai findFirst + create supaya idempotent tanpa memaksa id.
  const packagesData = [
    {
      name: 'Paket Prewedding',
      description: 'Abadikan momen cinta Anda dengan foto prewedding profesional',
      price: 2500000,
      duration: '4 jam',
      category: 'prewedding',
      features: ['2 Fotografer profesional', '200 foto hasil edit', 'Album digital HD', 'Free konsultasi', 'Free cetak 10R 5 lembar'],
      availableDays: ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'],
      isActive: true,
    },
    {
      name: 'Paket Wisuda',
      description: 'Rayakan pencapaian besar Anda dengan foto wisuda berkualitas tinggi',
      price: 750000,
      duration: '2 jam',
      category: 'wisuda',
      features: ['1 Fotografer profesional', '100 foto hasil edit', 'Album digital HD', 'Boleh bawa 5 orang pendamping'],
      availableDays: ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'],
      isActive: true,
    },
    {
      name: 'Paket Foto Keluarga',
      description: 'Moment kebersamaan keluarga yang tak terlupakan',
      price: 1200000,
      duration: '3 jam',
      category: 'keluarga',
      features: ['1 Fotografer profesional', '150 foto hasil edit', 'Album digital HD', 'Maksimal 10 orang'],
      availableDays: ['Sabtu', 'Minggu'],
      isActive: true,
    },
  ];

  for (const pkgData of packagesData) {
    let pkg = await prisma.package.findFirst({ where: { name: pkgData.name } });
    if (!pkg) {
      pkg = await prisma.package.create({ data: { ...pkgData, images: [] } });
      console.log('✅ Package created:', pkg.name);
    } else {
      console.log('↺ Package sudah ada, skip:', pkg.name);
    }

    // ===== BACKGROUNDS per paket =====
    const bgNames = ['Putih Polos', 'Hitam Elegan', 'Garden / Taman', 'Brick Wall'];
    for (const bgName of bgNames) {
      const existingBg = await prisma.packageBackground.findFirst({
        where: { packageId: pkg.id, name: bgName },
      });
      if (!existingBg) {
        await prisma.packageBackground.create({
          data: { packageId: pkg.id, name: bgName, imageUrl: null, isAvailable: true },
        });
      }
    }
    console.log(`  ↳ ${bgNames.length} backgrounds dipastikan ada untuk "${pkg.name}"`);
  }

  // ===== SAMPLE TIME SLOTS =====
  // ✅ FIX: TimeSlot TIDAK punya packageId di schema — ini slot umum (misal untuk fitur booking berbasis slot,
  // independen dari paket). Kita buat slot untuk hari ini & besok saja, tanpa unique constraint yang salah.
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);

  const timeRanges = [
    { start: '09:00', end: '11:00' },
    { start: '11:00', end: '13:00' },
    { start: '13:00', end: '15:00' },
    { start: '15:00', end: '17:00' },
  ];

  let slotCount = 0;
  for (const date of [today, tomorrow]) {
    for (const range of timeRanges) {
      const existing = await prisma.timeSlot.findFirst({
        where: { date, startTime: range.start },
      });
      if (!existing) {
        await prisma.timeSlot.create({
          data: { date, startTime: range.start, endTime: range.end, status: 'available' },
        });
        slotCount++;
      }
    }
  }
  console.log(`  ↳ ${slotCount} time slot baru dibuat (hari ini & besok)`);

  console.log('\n🎉 Seeding selesai!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📧 Admin    : admin@studiobion.com    | Pass: admin123');
  console.log('📧 Manager  : manager@studiobion.com  | Pass: manager123');
  console.log('🏢 Studio   : Studio 1 & Studio 2 aktif');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('⚠️  Segera ganti password setelah login pertama!');
}

main()
  .catch((e) => { console.error('❌ Error:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());