import type { NextApiRequest, NextApiResponse } from 'next';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import nookies from 'nookies';
import { prisma } from '@/lib/prisma';

const SECRET_KEY = process.env.JWT_SECRET;

if (!SECRET_KEY) {
  throw new Error('JWT_SECRET is not defined in the environment variables.');
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: `Metode ${req.method} tidak diizinkan.` });
  }

  const { user, pass } = req.body;

  if (!user || !pass) {
    return res.status(400).json({ message: 'Username dan password wajib diisi.' });
  }

  try {
    // 1. Goleki data user soko MySQL nggunakno Prisma
    const dataFounder = await prisma.user.findFirst({
      where: {
        username: user, // user soko req.body
        role: 'ketua'
        // Opsi: kowe iso nambahno filter role: 'founder' yen perlu
      },
    });

    // Yen username gak ketemu
    if (!dataFounder) {
      return res.status(401).json({ message: 'Password salah.' }); 
      // Pesan digawe podo ben hacker bingung endi sing salah
    }

    // 2. Verifikasi password sing di-hash
    const isMatch = await bcrypt.compare(pass, dataFounder.password);

    if (!isMatch) {
      return res.status(401).json({ message: 'Password salah.' });
    }

    // 3. ✅ Buat token JWT (Short lived: 3 menit)
    const token = jwt.sign(
      {
        id: dataFounder.id,
        user: dataFounder.username,
        role: dataFounder.role,
      },
      SECRET_KEY as string,
      { expiresIn: '3m' }
    );

    // 4. Set token neng cookie nganggo nookies (session_admin)
    nookies.set({ res }, 'session_admin', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 3 * 60, // 3 menit
      path: '/',
    });

    // 5. Kirim respon sukses
    return res.status(200).json({
      success: true,
      user: {
        id: dataFounder.id,
        user: dataFounder.username,
        role: dataFounder.role,
      },
      token,
    });

  } catch (err: unknown) {
    if (err instanceof Error) {
      console.error('🔴 Login Admin Error:', err.message);
    }
    return res.status(500).json({ message: 'Terjadi kesalahan di server.' });
  }
}