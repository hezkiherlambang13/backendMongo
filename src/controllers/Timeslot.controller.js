// server/src/controllers/timeSlot.controller.js
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET slots untuk paket + tanggal tertentu
export const getSlotsByPackageAndDate = async (req, res) => {
  try {
    const { packageId, date } = req.query;
    if (!packageId || !date)
      return res.status(400).json({ success: false, message: 'packageId dan date diperlukan' });

    const slots = await prisma.timeSlot.findMany({
      where: {
        packageId,
        date: new Date(date),
      },
      orderBy: { startTime: 'asc' },
    });

    res.json({ success: true, data: slots });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

// CREATE slot (Admin)
export const createSlot = async (req, res) => {
  try {
    const { packageId, date, startTime, endTime } = req.body;

    const existing = await prisma.timeSlot.findUnique({
      where: { packageId_date_startTime: { packageId, date: new Date(date), startTime } },
    });
    if (existing)
      return res.status(400).json({ success: false, message: 'Slot sudah ada' });

    const slot = await prisma.timeSlot.create({
      data: { packageId, date: new Date(date), startTime, endTime, status: 'available' },
    });

    res.status(201).json({ success: true, data: slot });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

// BULK CREATE slots (Admin) - generate slot untuk satu hari
export const bulkCreateSlots = async (req, res) => {
  try {
    const { packageId, date, openTime, closeTime, durationMinutes } = req.body;
    // openTime: "09:00", closeTime: "17:00", durationMinutes: 60

    const slots = [];
    const [openH, openM] = openTime.split(':').map(Number);
    const [closeH, closeM] = closeTime.split(':').map(Number);
    const openTotal = openH * 60 + openM;
    const closeTotal = closeH * 60 + closeM;

    for (let t = openTotal; t < closeTotal; t += durationMinutes) {
      const startH = Math.floor(t / 60).toString().padStart(2, '0');
      const startMin = (t % 60).toString().padStart(2, '0');
      const endT = t + durationMinutes;
      const endH = Math.floor(endT / 60).toString().padStart(2, '0');
      const endMin = (endT % 60).toString().padStart(2, '0');

      slots.push({
        packageId,
        date: new Date(date),
        startTime: `${startH}:${startMin}`,
        endTime: `${endH}:${endMin}`,
        status: 'available',
      });
    }

    // Upsert — skip yang sudah ada
    const created = await prisma.$transaction(
      slots.map((s) =>
        prisma.timeSlot.upsert({
          where: { packageId_date_startTime: { packageId: s.packageId, date: s.date, startTime: s.startTime } },
          update: {},
          create: s,
        })
      )
    );

    res.status(201).json({ success: true, message: `${created.length} slot berhasil dibuat`, data: created });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

// UPDATE status slot (Admin - block/unblock)
export const updateSlotStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const slot = await prisma.timeSlot.update({
      where: { id: req.params.id },
      data: { status },
    });
    res.json({ success: true, data: slot });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

// DELETE slot (Admin)
export const deleteSlot = async (req, res) => {
  try {
    await prisma.timeSlot.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Slot dihapus' });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};