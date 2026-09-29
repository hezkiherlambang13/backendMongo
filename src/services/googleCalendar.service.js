// server/src/services/googleCalendar.service.js
import { google } from 'googleapis';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const SCOPES = ['https://www.googleapis.com/auth/calendar'];

// Email kalender penerima event (isi di .env)
const CALENDAR_TARGETS = [
  process.env.MANAGER_EMAIL,
  process.env.STUDIO_OFFICIAL_EMAIL,
].filter(Boolean);

function getAuthClient() {
  return new google.auth.GoogleAuth({
    keyFile: join(__dirname, '../../google-credentials.json'),
    scopes: SCOPES,
  });
}

/**
 * Buat event Google Calendar saat booking dibuat / diapprove
 * @param {Object} booking - data booking dari Prisma (include package, background, slot, user)
 */
export async function createCalendarEvent(booking) {
  if (CALENDAR_TARGETS.length === 0) {
    console.warn('⚠️  MANAGER_EMAIL dan STUDIO_OFFICIAL_EMAIL belum diset di .env');
    return [];
  }

  const auth = getAuthClient();
  const calendar = google.calendar({ version: 'v3', auth });

  // Gabungkan bookingDate + bookingTime jadi DateTime
  const [hour, minute] = (booking.bookingTime || '09:00').split(':').map(Number);
  const startDT = new Date(booking.bookingDate);
  startDT.setHours(hour, minute, 0, 0);

  // Durasi default 2 jam
  const durationHours = booking.package?.durationHours || 2;
  const endDT = new Date(startDT.getTime() + durationHours * 60 * 60 * 1000);

  const event = {
    summary: `📸 Booking #${booking.id} — ${booking.package?.name || 'Sesi Foto'}`,
    description: buildDescription(booking),
    start: {
      dateTime: startDT.toISOString(),
      timeZone: 'Asia/Makassar', // WITA — Manado/Sulawesi
    },
    end: {
      dateTime: endDT.toISOString(),
      timeZone: 'Asia/Makassar',
    },
    attendees: CALENDAR_TARGETS.map((email) => ({ email })),
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'email', minutes: 24 * 60 }, // H-1
        { method: 'popup', minutes: 60 },       // 1 jam sebelum
      ],
    },
    colorId: '7', // Peacock (biru teal)
  };

  const results = [];

  for (const calendarEmail of CALENDAR_TARGETS) {
    try {
      const response = await calendar.events.insert({
        calendarId: calendarEmail,
        resource: event,
        sendUpdates: 'all',
      });

      console.log(`✅ Calendar event dibuat di [${calendarEmail}]: ${response.data.htmlLink}`);
      results.push({
        calendarEmail,
        eventId: response.data.id,
        eventLink: response.data.htmlLink,
        status: 'success',
      });
    } catch (err) {
      console.error(`❌ Gagal buat event di [${calendarEmail}]:`, err.message);
      results.push({ calendarEmail, status: 'failed', error: err.message });
    }
  }

  return results;
}

/**
 * Hapus event dari semua kalender (saat booking cancelled / rejected / deleted)
 * @param {Array} calendarEvents - [{calendarEmail, eventId}] disimpan sebagai JSON di Prisma
 */
export async function deleteCalendarEvent(calendarEvents = []) {
  if (!calendarEvents.length) return;

  const auth = getAuthClient();
  const calendar = google.calendar({ version: 'v3', auth });

  for (const { calendarEmail, eventId } of calendarEvents) {
    try {
      await calendar.events.delete({ calendarId: calendarEmail, eventId });
      console.log(`🗑️  Event dihapus dari [${calendarEmail}]`);
    } catch (err) {
      console.error(`Gagal hapus event di [${calendarEmail}]:`, err.message);
    }
  }
}

/**
 * Update event saat booking diubah
 */
export async function updateCalendarEvent(calendarEvents = [], booking) {
  if (!calendarEvents.length) return;

  const auth = getAuthClient();
  const calendar = google.calendar({ version: 'v3', auth });

  const [hour, minute] = (booking.bookingTime || '09:00').split(':').map(Number);
  const startDT = new Date(booking.bookingDate);
  startDT.setHours(hour, minute, 0, 0);
  const endDT = new Date(startDT.getTime() + 2 * 60 * 60 * 1000);

  for (const { calendarEmail, eventId } of calendarEvents) {
    try {
      await calendar.events.patch({
        calendarId: calendarEmail,
        eventId,
        resource: {
          summary: `📸 Booking #${booking.id} — ${booking.package?.name || 'Sesi Foto'}`,
          description: buildDescription(booking),
          start: { dateTime: startDT.toISOString(), timeZone: 'Asia/Makassar' },
          end:   { dateTime: endDT.toISOString(),   timeZone: 'Asia/Makassar' },
        },
      });
      console.log(`✏️  Event diupdate di [${calendarEmail}]`);
    } catch (err) {
      console.error(`Gagal update event di [${calendarEmail}]:`, err.message);
    }
  }
}

// ── Helper: format deskripsi event ──────────────────────────────────────────
function buildDescription(booking) {
  const tgl = new Date(booking.bookingDate).toLocaleDateString('id-ID', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });
  const harga = `Rp ${Number(booking.totalPrice || 0).toLocaleString('id-ID')}`;

  return [
    '🧾 DETAIL BOOKING',
    '══════════════════════════',
    `🆔 ID Booking     : #${booking.id}`,
    `👤 Nama           : ${booking.userName || '-'}`,
    `📞 WhatsApp       : ${booking.userPhone || '-'}`,
    `📧 Email          : ${booking.userEmail || '-'}`,
    `📦 Paket          : ${booking.package?.name || '-'}`,
    `🖼️  Background     : ${booking.background?.name || 'Default'}`,
    `📅 Tanggal        : ${tgl}`,
    `🕐 Jam            : ${booking.bookingTime || '-'}`,
    `💰 Total          : ${harga}`,
    `📋 Status         : ${booking.status?.toUpperCase() || '-'}`,
    `📝 Catatan        : ${booking.notes || '-'}`,
    '══════════════════════════',
    'Dibuat otomatis oleh sistem Digibox Studio.',
  ].join('\n');
}
