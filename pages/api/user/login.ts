import type { NextApiRequest, NextApiResponse } from "next";
import bcrypt from "bcryptjs";
import nookies from 'nookies';
import { RowDataPacket } from 'mysql2';
import jwt from 'jsonwebtoken';
import db from "@/config/db";

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
      
      // Query user from MySQL
      const [rows] = await db.execute<UserData[]>(
        "SELECT id, username, password, role, canGet, canUpload FROM users WHERE username = ? AND role = 'member' LIMIT 1",
        [user]
      );

      if (!rows || rows.length === 0) {
        return res.status(401).json({ success: false, message: "Username tidak ditemukan." });
      }

      const dataUser = rows.map(row => ({
        id: row.id,
        username: row.username,
        password: row.password,
        role: row.role,
        canGet: row.canGet,
        canUpload: row.canUpload
      }));

      // ✅ Verifikasi password dari server!
      const isMatch = await bcrypt.compare(pass, dataUser[0].password);

      if (!isMatch) {
        return res.status(401).json({ success: false, message: "Password salah." });
      }

      // 🔐 Buat token JWT
      const token = jwt.sign(
        {
          id: dataUser[0].id,
          user: dataUser[0].username,
          role: dataUser[0].role,
          canUpload: dataUser[0].canUpload,
          canGet: dataUser[0].canGet,
        },
        SECRET_KEY as string,
        { expiresIn: '1d' } // Token valid 30 menit
      );

      // 🍪 Simpan token di cookie
      nookies.set({ res }, 'sessionid', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 30 * 60, // 30 menit
        path: '/',
      });

      return res.status(200).json({
        success: true,
        message: 'Login user berhasil',
        token,
        user: {
          id: dataUser[0].id,
          user: dataUser[0].username,
          role: dataUser[0].role,
          canUpload: dataUser[0].canUpload,
          canGet: dataUser[0].canGet,
        },
      });

    } catch (error) {
      console.error("Login error:", error);
      return res.status(500).json({ success: false, message: "Internal Server Error" });
    }
  }

  return res.status(405).json({ success: false, message: `Method ${req.method} Not Allowed` });
}