import nodemailer from 'nodemailer';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const DEFAULT_TEMPLATE = {
  subject: 'Konfirmasi Booking #{{bookingId}} — Digibox Studio',
  bodyHtml: `<p>Halo {{customerName}},</p>
<p>Terima kasih telah melakukan booking di Digibox Studio! Berikut detail pesanan Anda:</p>
<table style="width:100%; border-collapse:collapse; margin:16px 0;">
<tr><td style="padding:6px 0; color:#666;">No. Booking</td><td style="padding:6px 0; font-weight:bold;">#{{bookingId}}</td></tr>
<tr><td style="padding:6px 0; color:#666;">Paket</td><td style="padding:6px 0; font-weight:bold;">{{packageName}}</td></tr>
<tr><td style="padding:6px 0; color:#666;">Studio</td><td style="padding:6px 0; font-weight:bold;">{{studioName}}</td></tr>
<tr><td style="padding:6px 0; color:#666;">Tanggal</td><td style="padding:6px 0; font-weight:bold;">{{bookingDate}}</td></tr>
<tr><td style="padding:6px 0; color:#666;">Jam</td><td style="padding:6px 0; font-weight:bold;">{{bookingTime}}</td></tr>
<tr><td style="padding:6px 0; color:#666;">Lokasi</td><td style="padding:6px 0; font-weight:bold;">{{location}}</td></tr>
<tr><td style="padding:6px 0; color:#666;">Total</td><td style="padding:6px 0; font-weight:bold;">Rp {{totalPrice}}</td></tr>
</table>
<p>Segera lakukan pembayaran melalui link berikut untuk mengamankan slot Anda:<br/>
<a href="{{lynkUrl}}" style="color:#022c22; font-weight:bold;">{{lynkUrl}}</a></p>
<p>Mohon selesaikan pembayaran sesuai ketentuan yang berlaku agar booking Anda tetap terjaga.</p>`,
  footerHtml: '<p style="color:#888; font-size:13px;">Digibox Studio — Terima kasih atas kepercayaan Anda.</p>',
};

const fillTemplate = (str, data) =>
  (str || '').replace(/{{(\w+)}}/g, (match, key) => (data[key] !== undefined ? data[key] : match));

export const getEmailTemplate = async () => {
  try {
    const tpl = await prisma.emailTemplate.findUnique({ where: { key: 'booking_confirmation' } });
    return tpl || DEFAULT_TEMPLATE;
  } catch {
    return DEFAULT_TEMPLATE;
  }
};

export const sendBookingConfirmationEmail = async (booking) => {
  if (!booking.userEmail) {
    console.warn('⚠️  Booking tanpa email, skip pengiriman.');
    return;
  }

  const tpl = await getEmailTemplate();

  const data = {
    customerName: booking.userName || 'Pelanggan',
    bookingId: booking.id,
    packageName: booking.package?.name || '-',
    studioName: booking.studio?.name || '-',
    bookingDate: booking.bookingDate
      ? new Date(booking.bookingDate).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
      : '-',
    bookingTime: booking.bookingTime || '-',
    totalPrice: booking.totalPrice ? Number(booking.totalPrice).toLocaleString('id-ID') : '0',
    lynkUrl: booking.package?.lynkUrl || '#',
    location: process.env.STUDIO_ADDRESS || 'Digibox Studio',
  };

  const subject = fillTemplate(tpl.subject, data);
  const body = fillTemplate(tpl.bodyHtml, data);
  const footer = fillTemplate(tpl.footerHtml, data);

  await transporter.sendMail({
    from: `"Digibox Studio" <${process.env.EMAIL_USER}>`,
    to: booking.userEmail,
    subject,
    html: `<div style="font-family:Arial,sans-serif; max-width:600px; margin:0 auto; padding:20px;">${body}<hr style="border:none; border-top:1px solid #eee; margin:20px 0;"/>${footer}</div>`,
  });

  console.log(`📧 Email konfirmasi terkirim ke ${booking.userEmail}`);
};