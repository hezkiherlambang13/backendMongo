// server/src/controllers/booking.controller.js
import { PrismaClient } from '@prisma/client';
import { addMinutes } from '../utils/Datehelper.js';
import {
  createCalendarEvent,
  deleteCalendarEvent,
  updateCalendarEvent,
} from '../services/googleCalendar.service.js';

const prisma = new PrismaClient();

export const getAllBookings = async (req, res) => {
  try {
    const where = req.user.role === 'user' ? { userId: req.user.id } : {};
    const bookings = await prisma.booking.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, email: true, phone: true } },
        package: { select: { id: true, name: true, price: true, category: true, images: true } },
        background: true,
        slot: true,
        approvedBy: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data: bookings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createBooking = async (req, res) => {
  try {
    const { packageId, backgroundId, slotId, bookingDate, bookingTime, userName, userPhone, userEmail, notes } = req.body;

    const pkgId = parseInt(packageId);
    const bgId = backgroundId ? parseInt(backgroundId) : null;
    const slId = slotId ? parseInt(slotId) : null;

    if (isNaN(pkgId)) return res.status(400).json({ success: false, message: 'packageId tidak valid' });

    const pkg = await prisma.package.findUnique({ where: { id: pkgId }, include: { backgrounds: true } });
    if (!pkg) return res.status(404).json({ success: false, message: 'Paket tidak ditemukan' });
    if (!pkg.isActive) return res.status(400).json({ success: false, message: 'Paket tidak tersedia' });

    if (bgId) {
      const bg = await prisma.packageBackground.findUnique({ where: { id: bgId } });
      if (!bg || !bg.isAvailable) return res.status(400).json({ success: false, message: 'Background tidak tersedia' });
    }

    if (slId) {
      const slot = await prisma.timeSlot.findUnique({ where: { id: slId } });
      if (!slot) return res.status(404).json({ success: false, message: 'Slot tidak ditemukan' });
      if (slot.status !== 'available') return res.status(400).json({ success: false, message: 'Slot sudah dipesan' });
      await prisma.timeSlot.update({ where: { id: slId }, data: { status: 'booked' } });
    } else {
      const existing = await prisma.booking.findFirst({
        where: { packageId: pkgId, bookingDate: new Date(bookingDate), bookingTime, status: { in: ['pending', 'approved'] } },
      });
      if (existing) return res.status(400).json({ success: false, message: 'Slot waktu ini sudah dipesan' });
    }

    const booking = await prisma.booking.create({
      data: {
        userId: req.user.id,
        packageId: pkgId,
        backgroundId: bgId,
        slotId: slId,
        bookingDate: new Date(bookingDate),
        bookingTime,
        userName,
        userPhone,
        userEmail,
        notes: notes || '',
        totalPrice: pkg.price,
        status: 'pending',
        paymentStatus: 'unpaid',
        expiresAt: addMinutes(new Date(), 15),
      },
      include: { package: true, background: true, slot: true },
    });

    // ── Google Calendar ────────────────────────────────────────────────────
    try {
      const calendarResults = await createCalendarEvent(booking);
      const successEvents = calendarResults
        .filter((r) => r.status === 'success')
        .map(({ calendarEmail, eventId }) => ({ calendarEmail, eventId }));
      if (successEvents.length > 0) {
        await prisma.booking.update({ where: { id: booking.id }, data: { calendarEvents: successEvents } });
        booking.calendarEvents = successEvents;
      }
    } catch (calErr) {
      console.error('⚠️  Google Calendar error:', calErr.message);
    }
    // ──────────────────────────────────────────────────────────────────────

    res.status(201).json({
      success: true,
      message: 'Booking berhasil dibuat. Menunggu konfirmasi admin (15 menit).',
      data: booking,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ NEW: Reschedule booking
export const rescheduleBooking = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ success: false, message: 'ID tidak valid' });

    const { bookingDate, bookingTime } = req.body;
    if (!bookingDate || !bookingTime) {
      return res.status(400).json({ success: false, message: 'bookingDate dan bookingTime wajib diisi' });
    }

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: { package: true, background: true, slot: true },
    });
    if (!booking) return res.status(404).json({ success: false, message: 'Booking tidak ditemukan' });

    // Hanya user pemilik booking yang bisa reschedule
    if (booking.userId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Akses ditolak' });
    }

    // Hanya booking pending atau approved yang bisa di-reschedule
    if (!['pending', 'approved'].includes(booking.status)) {
      return res.status(400).json({ success: false, message: 'Booking ini tidak bisa di-reschedule' });
    }

    // Tidak bisa reschedule ke tanggal yang sudah lewat
    const newDate = new Date(bookingDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (newDate < today) {
      return res.status(400).json({ success: false, message: 'Tidak bisa reschedule ke tanggal yang sudah lewat' });
    }

    // Cek apakah slot baru sudah dipesan (kecuali booking ini sendiri)
    const conflict = await prisma.booking.findFirst({
      where: {
        packageId: booking.packageId,
        bookingDate: newDate,
        bookingTime,
        status: { in: ['pending', 'approved'] },
        id: { not: id }, // exclude diri sendiri
      },
    });
    if (conflict) {
      return res.status(400).json({ success: false, message: 'Slot waktu ini sudah dipesan oleh orang lain' });
    }

    // Update booking
    const updated = await prisma.booking.update({
      where: { id },
      data: {
        bookingDate: newDate,
        bookingTime,
        // Reset ke pending jika sebelumnya approved (perlu konfirmasi ulang)
        status: booking.status === 'approved' ? 'pending' : booking.status,
        approvedById: booking.status === 'approved' ? null : booking.approvedById,
        approvedAt: booking.status === 'approved' ? null : booking.approvedAt,
        paymentDeadline: booking.status === 'approved' ? null : booking.paymentDeadline,
        expiresAt: addMinutes(new Date(), 15),
      },
      include: {
        package: true,
        background: true,
        slot: true,
        user: { select: { id: true, name: true, email: true } },
      },
    });

    // ── Google Calendar: update event ─────────────────────────────────────
    try {
      const calEvents = booking.calendarEvents || [];
      if (calEvents.length > 0) {
        await updateCalendarEvent(calEvents, updated);
      } else {
        // Jika belum ada event (misal gagal saat create), buat baru
        const calendarResults = await createCalendarEvent(updated);
        const successEvents = calendarResults
          .filter((r) => r.status === 'success')
          .map(({ calendarEmail, eventId }) => ({ calendarEmail, eventId }));
        if (successEvents.length > 0) {
          await prisma.booking.update({ where: { id }, data: { calendarEvents: successEvents } });
        }
      }
    } catch (calErr) {
      console.error('⚠️  Google Calendar update error:', calErr.message);
    }
    // ─────────────────────────────────────────────────────────────────────

    res.json({
      success: true,
      message: booking.status === 'approved'
        ? 'Jadwal berhasil diubah. Status kembali ke pending dan menunggu konfirmasi ulang dari admin.'
        : 'Jadwal berhasil diubah.',
      data: updated,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateBookingStatus = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ success: false, message: 'ID tidak valid' });

    const { status, cancelReason } = req.body;
    const booking = await prisma.booking.findUnique({
      where: { id },
      include: { slot: true, package: true, background: true },
    });
    if (!booking) return res.status(404).json({ success: false, message: 'Booking tidak ditemukan' });

    const updateData = { status };
    if (status === 'approved') {
      updateData.approvedById = req.user.id;
      updateData.approvedAt = new Date();
      updateData.paymentDeadline = addMinutes(new Date(), 24 * 60);
    }
    if (status === 'rejected' || status === 'cancelled') {
      if (cancelReason) updateData.cancelReason = cancelReason;
      if (booking.slotId) {
        await prisma.timeSlot.update({ where: { id: booking.slotId }, data: { status: 'available' } });
      }
      try {
        const calEvents = booking.calendarEvents || [];
        if (calEvents.length > 0) await deleteCalendarEvent(calEvents);
      } catch (calErr) {
        console.error('⚠️  Gagal hapus Calendar event:', calErr.message);
      }
    }

    const updated = await prisma.booking.update({
      where: { id },
      data: updateData,
      include: {
        user: { select: { id: true, name: true, email: true, phone: true } },
        package: { select: { id: true, name: true, price: true, category: true } },
        background: true,
        slot: true,
        approvedBy: { select: { id: true, name: true } },
      },
    });

    res.json({ success: true, message: `Booking berhasil di-${status}`, data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getWhatsAppLink = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ success: false, message: 'ID tidak valid' });

    const booking = await prisma.booking.findUnique({ where: { id }, include: { package: true, background: true } });
    if (!booking) return res.status(404).json({ success: false, message: 'Booking tidak ditemukan' });
    if (booking.status !== 'approved') return res.status(400).json({ success: false, message: 'Booking belum diapprove.' });
    if (booking.userId !== req.user.id) return res.status(403).json({ success: false, message: 'Akses ditolak' });

    const adminWA = process.env.ADMIN_WHATSAPP || '628100000000';
    const date = new Date(booking.bookingDate).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const message = encodeURIComponent(
      `Halo Admin Digibox Studio! 📸\n\n` +
      `• ID: #${booking.id}\n• Nama: ${booking.userName}\n• Paket: ${booking.package?.name}\n` +
      `• Tanggal: ${date}\n• Jam: ${booking.bookingTime}\n• Total: Rp ${booking.totalPrice?.toLocaleString('id-ID')}\n\nTerima kasih! 🙏`
    );

    await prisma.booking.update({ where: { id }, data: { paymentStatus: 'waiting_confirmation' } });
    res.json({ success: true, data: { waLink: `https://wa.me/${adminWA}?text=${message}`, booking } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const cancelBooking = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ success: false, message: 'ID tidak valid' });

    const booking = await prisma.booking.findUnique({ where: { id } });
    if (!booking) return res.status(404).json({ success: false, message: 'Booking tidak ditemukan' });
    if (booking.userId !== req.user.id) return res.status(403).json({ success: false, message: 'Akses ditolak' });
    if (!['pending', 'approved'].includes(booking.status)) return res.status(400).json({ success: false, message: 'Booking tidak bisa dibatalkan' });

    if (booking.slotId) {
      await prisma.timeSlot.update({ where: { id: booking.slotId }, data: { status: 'available' } });
    }
    try {
      const calEvents = booking.calendarEvents || [];
      if (calEvents.length > 0) await deleteCalendarEvent(calEvents);
    } catch (calErr) {
      console.error('⚠️  Gagal hapus Calendar event:', calErr.message);
    }

    await prisma.booking.update({ where: { id }, data: { status: 'cancelled', cancelReason: 'Dibatalkan oleh user' } });
    res.json({ success: true, message: 'Booking berhasil dibatalkan' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteBooking = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ success: false, message: 'ID tidak valid' });

    const booking = await prisma.booking.findUnique({ where: { id } });
    if (!booking) return res.status(404).json({ success: false, message: 'Booking tidak ditemukan' });

    if (booking.slotId) {
      await prisma.timeSlot.update({ where: { id: booking.slotId }, data: { status: 'available' } });
    }
    try {
      const calEvents = booking.calendarEvents || [];
      if (calEvents.length > 0) await deleteCalendarEvent(calEvents);
    } catch (calErr) {
      console.error('⚠️  Gagal hapus Calendar event:', calErr.message);
    }

    await prisma.booking.delete({ where: { id } });
    res.json({ success: true, message: 'Booking berhasil dihapus' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getBookingStats = async (req, res) => {
  try {
    const [total, pending, approved, completed, expired, revenueData] = await Promise.all([
      prisma.booking.count(),
      prisma.booking.count({ where: { status: 'pending' } }),
      prisma.booking.count({ where: { status: 'approved' } }),
      prisma.booking.count({ where: { status: 'completed' } }),
      prisma.booking.count({ where: { status: 'expired' } }),
      prisma.booking.aggregate({ where: { status: 'completed', paymentStatus: 'paid' }, _sum: { totalPrice: true } }),
    ]);
    res.json({
      success: true,
      data: {
        totalBookings: total,
        pendingBookings: pending,
        approvedBookings: approved,
        completedBookings: completed,
        expiredBookings: expired,
        totalRevenue: revenueData._sum.totalPrice || 0,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getManagerStats = async (req, res) => {
  try {
    const [total, pending, approved, completed] = await Promise.all([
      prisma.booking.count(),
      prisma.booking.count({ where: { status: 'pending' } }),
      prisma.booking.count({ where: { status: 'approved' } }),
      prisma.booking.count({ where: { status: 'completed' } }),
    ]);
    res.json({ success: true, data: { total, pending, approved, completed } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const expireBookings = async () => {
  try {
    const now = new Date();
    const expiredBookings = await prisma.booking.findMany({ where: { status: 'pending', expiresAt: { lt: now } } });
    for (const booking of expiredBookings) {
      if (booking.slotId) {
        await prisma.timeSlot.update({ where: { id: booking.slotId }, data: { status: 'available' } });
      }
      try {
        const calEvents = booking.calendarEvents || [];
        if (calEvents.length > 0) await deleteCalendarEvent(calEvents);
      } catch (_) {}
      await prisma.booking.update({ where: { id: booking.id }, data: { status: 'expired', cancelReason: 'Booking expired' } });
    }
    if (expiredBookings.length > 0) console.log(`⏰ ${expiredBookings.length} booking expired`);
  } catch (error) {
    console.error('Error expiring bookings:', error);
  }
};

export const getBookedTimes = async (req, res) => {
  try {
    const { packageId, date, excludeBookingId } = req.query;
    if (!packageId || !date) {
      return res.status(400).json({ success: false, message: 'packageId dan date diperlukan' });
    }
    const pkgId = parseInt(packageId);
    if (isNaN(pkgId)) return res.status(400).json({ success: false, message: 'packageId tidak valid' });

    const where = {
      packageId: pkgId,
      bookingDate: new Date(date),
      status: { in: ['pending', 'approved'] },
    };

    // ✅ Exclude booking yang sedang di-reschedule agar slot lamanya tidak ke-block
    if (excludeBookingId) {
      const exclId = parseInt(excludeBookingId);
      if (!isNaN(exclId)) where.id = { not: exclId };
    }

    const bookings = await prisma.booking.findMany({ where, select: { bookingTime: true } });
    res.json({ success: true, data: bookings.map((b) => b.bookingTime) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updatePhotoPickup = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ success: false, message: 'ID tidak valid' });

    const { photoPickupDate, photoPickupBy, photoPickupNotes, photoPickupStatus } = req.body;
    const booking = await prisma.booking.findUnique({ where: { id } });
    if (!booking) return res.status(404).json({ success: false, message: 'Booking tidak ditemukan' });
    if (!['approved', 'completed'].includes(booking.status))
      return res.status(400).json({ success: false, message: 'Hanya booking approved/completed yang bisa diupdate pengambilan foto' });

    const updated = await prisma.booking.update({
      where: { id },
      data: {
        photoPickupDate: photoPickupDate ? new Date(photoPickupDate) : booking.photoPickupDate,
        photoPickupBy: photoPickupBy ?? booking.photoPickupBy,
        photoPickupNotes: photoPickupNotes ?? booking.photoPickupNotes,
        photoPickupStatus: photoPickupStatus ?? booking.photoPickupStatus,
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
        package: { select: { id: true, name: true } },
        approvedBy: { select: { id: true, name: true } },
      },
    });
    res.json({ success: true, message: 'Info pengambilan foto berhasil diupdate', data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};