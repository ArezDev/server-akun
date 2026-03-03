/* eslint-disable @typescript-eslint/no-explicit-any */
import type { NextApiRequest, NextApiResponse } from 'next';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ message: 'Method not allowed' });
    }

    const { user, pass, id, canGet, canUpload } = req.body;

    if (!id) {
      return res.status(400).json({ message: 'ID tidak boleh kosong' });
    }

    // 1. Siapno object data sing arep di-update (Dynamic Update)
    const updateData: any = {};

    if (user) updateData.username = user;
    
    if (pass) {
      updateData.password = await bcrypt.hash(pass, 12);
    }

    // Konversi boolean soko body dadi 1 utawa 0 nggo MySQL
    updateData.canGet = canGet ? 1 : 0;
    updateData.canUpload = canUpload ? 1 : 0;

    // 2. Eksekusi Update
    const updatedUser = await prisma.user.update({
      where: {
        id: Number(id),
      },
      data: updateData,
    });

    if (updatedUser) {
      return res.status(200).json({ 
        success: true, 
        message: `User: ${user || updatedUser.username} berhasil diedit!` 
      });
    }

  } catch (error: unknown) {
    const err = error as Error;
    
    // P2025 iku kode Prisma yen record sing arep di-update ora ketemu
    if (err.message.includes('Record to update not found')) {
      return res.status(404).json({ success: false, message: 'User ora ketemu!' });
    }

    console.error('🔴 Database Error:', err.message);
    return res.status(500).json({ 
      success: false, 
      msg: 'Gagal mengakses database',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined 
    });
  }
}
