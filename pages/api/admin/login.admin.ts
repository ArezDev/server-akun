import type { NextApiRequest, NextApiResponse } from 'next';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from "@/config/db";
import { RowDataPacket } from 'mysql2';
import nookies from 'nookies';

const SECRET_KEY = process.env.JWT_SECRET;

if (!SECRET_KEY) {
  throw new Error('JWT_SECRET is not defined in the environment variables.');
}

interface userData extends RowDataPacket {
  id: number;
  user: string;
  pass: string;
  role: string;
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
    // Cari user berdasarkan username
    const [rows] = await db.query<userData[]>('SELECT * FROM id_user WHERE user = ?', [user]);

    if (!Array.isArray(rows) || rows.length === 0) {
      return res.status(401).json({ message: 'Username tidak ditemukan.' });
    }

    const userData = rows[0];

    // verifikasi password yang dihash..!
    const isMatch = await bcrypt.compare(pass, userData.pass);

    if (!isMatch) {
      return res.status(401).json({ message: 'Password salah.' });
    }

    // ✅ Buat token JWT
    const token = jwt.sign(
      {
        id: userData.id,
        user: userData.user,
        role: userData.role,
      },
      SECRET_KEY as string,
      { expiresIn: '3m' } // Token valid 3 menit
    );

    // Set token di cookie dengan nookies
    nookies.set({ res }, 'session_admin', token, {
        httpOnly: true, // Token hanya bisa diakses oleh server, tidak oleh JS di browser
        secure: process.env.NODE_ENV === 'production', // Pastikan di HTTPS di production
        maxAge: 3 * 60, // Set cookie expired dalam 3 menit
        path: '/', // Cookie berlaku di seluruh domain
    });

    // Kirim token ke client
    return res.status(200).json({
      message: 'Login berhasil',
      token, // ⬅️ ini token-nya
      user: {
        id: userData.id,
        user: userData.user,
        role: userData.role,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ message: 'Terjadi kesalahan di server.' });
  }
}