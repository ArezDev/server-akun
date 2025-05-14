import type { NextApiRequest, NextApiResponse } from "next";
import bcrypt from "bcryptjs";
import db from "@/config/db";
import nookies from 'nookies';
import { RowDataPacket } from 'mysql2';
import jwt from 'jsonwebtoken';

const SECRET_KEY = process.env.JWT_SECRET;

interface UserData extends RowDataPacket {
  id: number;
  user: string;
  pass: string;
  role: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "POST") {
    const { user, pass } = req.body;

    if (!user || !pass) {
      return res.status(400).json({ success: false, message: "Username and password are required." });
    }

    try {
      // 🔍 Ambil user berdasarkan username saja
      const [rows] = await db.query<UserData[]>(
        'SELECT `id`, `user`, `pass`, `role` FROM `id_user` WHERE `user` = ?',
        [user]
      );

      if (!Array.isArray(rows) || rows.length === 0) {
        return res.status(401).json({ success: false, message: "User tidak ditemukan." });
      }

      if (rows[0].role === 'admin') {
        return res.status(401).json({ success: false, message: "Hey anda admin ngapain kesini..!" });
      }

      const userData = rows[0];

      // ✅ Verifikasi password dari server!
      const isMatch = await bcrypt.compare(pass, userData.pass);

      if (!isMatch) {
        return res.status(401).json({ success: false, message: "Password salah." });
      }

      // 🔐 Buat token JWT
      const token = jwt.sign(
        {
          id: userData.id,
          user: userData.user,
          role: userData.role,
        },
        SECRET_KEY as string,
        { expiresIn: '30m' } // Token valid 30 menit
      );

      // 🍪 Simpan token di cookie
      nookies.set({ res }, 'sessionid', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 30 * 60, // 3 menit
        path: '/',
      });

      return res.status(200).json({
        success: true,
        message: 'Login user berhasil',
        token,
        user: {
          id: userData.id,
          user: userData.user,
          role: userData.role,
        },
      });

    } catch (error) {
      console.error("Login error:", error);
      return res.status(500).json({ success: false, message: "Internal Server Error" });
    }
  }

  return res.status(405).json({ success: false, message: `Method ${req.method} Not Allowed` });
}