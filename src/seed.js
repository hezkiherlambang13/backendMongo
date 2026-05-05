// server/src/seed.js
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
dotenv.config();

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database Studio Bion...\n');

  // Admin
  const adminPass = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@studiobion.com' },
    update: {},
    create: { name: 'Admin Studio Bion', email: 'admin@studiobion.com', password: adminPass, role: 'admin', phone: '6281000000001' },
  });
  console.log('✅ Admin:', admin.email);

  // Manager
  const managerPass = await bcrypt.hash('manager123', 10);
  const manager = await prisma.user.upsert({
    where: { email: 'manager@studiobion.com' },
    update: {},
    create: { name: 'Manager Studio Bion', email: 'manager@studiobion.com', password: managerPass, role: 'manager', phone: '6281000000002' },
  });
  console.log('✅ Manager:', manager.email);

  // Sample packages
  const packages = [
    {
      id: 'pkg-prewedding',
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
      id: 'pkg-wisuda',
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
      id: 'pkg-keluarga',
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

  for (const pkg of packages) {
    const created = await prisma.package.upsert({
      where: { id: pkg.id },
      update: {},
      create: { ...pkg, images: [] },
    });
    console.log('✅ Package:', created.name);

    // Sample backgrounds untuk setiap paket
    const backgrounds = [
      { name: 'Putih Polos', imageUrl: null },
      { name: 'Hitam Elegan', imageUrl: null },
      { name: 'Garden / Taman', imageUrl: null },
      { name: 'Brick Wall', imageUrl: null },
    ];

    for (const bg of backgrounds) {
      await prisma.packageBackground.upsert({
        where: { id: `${pkg.id}-${bg.name}` },
        update: {},
        create: { id: `${pkg.id}-${bg.name}`, packageId: created.id, name: bg.name, imageUrl: bg.imageUrl, isAvailable: true },
      }).catch(() => {}); // skip jika sudah ada
    }
    console.log(`  ↳ ${backgrounds.length} backgrounds created`);

    // Sample time slots untuk hari ini dan besok
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const dates = [today, tomorrow];
    const times = [
      { start: '09:00', end: '11:00' },
      { start: '11:00', end: '13:00' },
      { start: '13:00', end: '15:00' },
      { start: '15:00', end: '17:00' },
    ];

    for (const date of dates) {
      for (const time of times) {
        const d = new Date(date);
        d.setHours(0, 0, 0, 0);
        await prisma.timeSlot.upsert({
          where: { packageId_date_startTime: { packageId: created.id, date: d, startTime: time.start } },
          update: {},
          create: { packageId: created.id, date: d, startTime: time.start, endTime: time.end, status: 'available' },
        });
      }
    }
    console.log(`  ↳ ${dates.length * times.length} time slots created`);
  }

  console.log('\n🎉 Seeding selesai!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📧 Admin    : admin@studiobion.com    | Pass: admin123');
  console.log('📧 Manager  : manager@studiobion.com  | Pass: manager123');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('⚠️  Segera ganti password setelah login pertama!');
}

main()
  .catch((e) => { console.error('❌ Error:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());