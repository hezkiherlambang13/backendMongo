import { PrismaClient } from '@prisma/client';
import { DEFAULT_TEMPLATE } from '../services/email.service.js';

const prisma = new PrismaClient();

export const getTemplate = async (req, res) => {
  try {
    const tpl = await prisma.emailTemplate.findUnique({ where: { key: 'booking_confirmation' } });
    res.json({ success: true, data: tpl || { ...DEFAULT_TEMPLATE, key: 'booking_confirmation' } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateTemplate = async (req, res) => {
  try {
    const { subject, bodyHtml, footerHtml } = req.body;
    if (!subject || !bodyHtml) {
      return res.status(400).json({ success: false, message: 'Subject dan isi email wajib diisi' });
    }

    const updated = await prisma.emailTemplate.upsert({
      where: { key: 'booking_confirmation' },
      update: { subject, bodyHtml, footerHtml: footerHtml || '' },
      create: { key: 'booking_confirmation', subject, bodyHtml, footerHtml: footerHtml || '' },
    });
    res.json({ success: true, message: 'Template email berhasil disimpan', data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const resetTemplate = async (req, res) => {
  try {
    const updated = await prisma.emailTemplate.upsert({
      where: { key: 'booking_confirmation' },
      update: { ...DEFAULT_TEMPLATE },
      create: { key: 'booking_confirmation', ...DEFAULT_TEMPLATE },
    });
    res.json({ success: true, message: 'Template dikembalikan ke default', data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};