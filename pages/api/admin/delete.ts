import { prisma } from '@/lib/prisma';
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ message: 'Method not allowed' });
    }

    const { id } = req.body;

    if (!id) {
      return res.status(400).json({ message: 'ID tidak boleh kosong' });
    }

    // 1. Eksekusi Delete nggunakno Prisma
    // Kita nggunakno deleteMany tinimbang delete biasa ben gak error 
    // yen ID-ne gak ketemu (delete biasa bakal throw error yen record null)
    const result = await prisma.user.deleteMany({
      where: {
        id: Number(id), // Pastikan ID di-convert dadi Number yen neng skema tipe-ne Int
      },
    });

    // 2. Cek opo ono baris sing kedaftar dibusak
    if (result.count === 1) {
      return res.status(200).json({ 
        success: true, 
        message: 'User berhasil dihapus!' 
      });
    } else {
      return res.status(404).json({ 
        success: false, 
        message: 'User gagal dihapus utawa ID ora ketemu!' 
      });
    }

  } catch (error: unknown) {
    const err = error as Error;
    console.error('🔴 Database Error:', err.message);

    return res.status(500).json({ 
      success: false, 
      msg: 'Gagal mengakses database',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined 
    });
  }
}