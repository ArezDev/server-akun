import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';
import { prisma } from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { cokis, userId } = req.body;

    // Validasi input
    if (!cokis || !userId) {
      return res.status(401).json({ message: 'userId tidak ditemukan...!' });
    }

    const user = await prisma.user.findFirst({
      where: {
        username: userId,
        canUpload: 1,
      },
      select: {
        canUpload: true,
      },
    });

    if (!user) {
      return res.status(401).json({ error: 'You dont have permissions to access..' });
    }

    // 2. Insert into fb_akun table
    const uploadCokis = await prisma.fbAkun.create({
      data: {
        fbne: userId,
        cokis: cokis,
        created_at: new Date(), // Prisma otomatis nangani format DateTime
      },
    });

    if (uploadCokis) {
      // 3. Kirim ke socket
      await axios.post(`${process.env.NEXT_PUBLIC_SOCKET_URL}/broadcast`, {
        event: `send-cokis-${userId}`,
        payload: {
          message: `User: ${userId} send cokis..`,
          fb: cokis,
        },
      });
    }
    return res.status(200).json({ success: true, cokis: cokis });
  } catch (error) {
    // Ngonversi unknown dadi Error object ben iso diwaca message-ne
    const err = error as Error;
    
    console.error('🔴 Database Error:', err.message);

    // Yen kowe pengen mbedakno error Prisma (misal: koneksi mati)
    // kowe iso nambahno pengecekan neng kene
    return res.status(500).json({ 
      success: false, 
      msg: 'Gagal mengakses database',
      // Opsi: tampilno error message pas dev mode wae
      error: process.env.NODE_ENV === 'development' ? err.message : undefined 
    });
  }
}