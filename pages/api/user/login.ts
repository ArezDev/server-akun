import type { NextApiRequest, NextApiResponse } from "next";
import bcrypt from "bcryptjs";
import nookies from 'nookies';
import jwt from 'jsonwebtoken';
import { prisma } from "@/lib/prisma";

const SECRET_KEY = process.env.JWT_SECRET;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "POST") {
    const { user, pass } = req.body;

    if (!user || !pass) {
      return res.status(400).json({ success: false, message: "Username and password are required." });
    }

    // ... neng njero handler login ...
    try {
      // 1. Goleki user nggunakno Prisma
      const dataUser = await prisma.user.findFirst({
        where: {
          username: user,
          role: 'member',
        },
      });

      // console.log("🔍 Input User:", user);
      // console.log("📂 Data soko DB:", dataUser);

      if (!dataUser) {
        return res.status(401).json({ success: false, message: "Username tidak ditemukan." });
      }

      const isMatch = await bcrypt.compare(pass, dataUser.password);
      // console.log("🔐 Password Match:", isMatch);

      if (!isMatch) {
        return res.status(401).json({ success: false, message: "Password salah." });
      }

      // 3. 🔐 Buat token JWT
      const token = jwt.sign(
        {
          id: dataUser.id,
          user: dataUser.username,
          role: dataUser.role,
          canUpload: dataUser.canUpload,
          canGet: dataUser.canGet,
        },
        SECRET_KEY as string,
        { expiresIn: '1d' }
      );

      // 4. 🍪 Simpan token di cookie nganggo nookies
      nookies.set({ res }, 'sessionid', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 30 * 60, // Iki 30 menit sesuai request-mu
        path: '/',
      });

      // 5. Return success
      return res.status(200).json({
        success: true,
        message: 'Login user berhasil',
        token,
        user: {
          id: dataUser.id,
          user: dataUser.username,
          role: dataUser.role,
          canUpload: dataUser.canUpload,
          canGet: dataUser.canGet,
        },
      });

    } catch (error: unknown) {
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

  return res.status(405).json({ success: false, message: `Method ${req.method} Not Allowed` });
}