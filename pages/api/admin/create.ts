import type { NextApiRequest, NextApiResponse } from 'next';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === 'POST') {
      const { user, pass, canGet, canUpload } = req.body;

      // 1. Validasi Input
      if (!user || typeof user !== 'string') {
        return res.status(400).json({ error: 'Field akun harus berupa string' });
      }
      if (!pass || typeof pass !== 'string') {
        return res.status(400).json({ error: 'Field "pass" harus berupa string' });
      }

      // 2. Hash password (ngamakno_password)
      // Salt 10-12 wis cukup Cak, 15 rada abot neng CPU tapi luwih aman banget
      const ngamakno_password = await bcrypt.hash(pass, 12);

      // 3. Insert nggunakno Prisma
      const newUser = await prisma.user.create({
        data: {
          username: user,
          password: ngamakno_password,
          canGet: canGet ? 1 : 0,
          canUpload: canUpload ? 1 : 0,
          role: 'member',
          // created_at otomatis diisi NOW() yen neng skema mbok set @default(now())
        },
      });

      if (newUser) {
        return res.status(200).json({ 
          success: true, 
          message: `User: ${user} ditambahkan!` 
        });
      }
    }

    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);

  } catch (error: unknown) {
    const err = error as Error;
    
    // Cek yen username wis ono (Unique Constraint Error neng Prisma)
    if (err.message.includes('Unique constraint failed')) {
      return res.status(400).json({ success: false, message: "Username wis tau digawe, golek liyane Cak!" });
    }

    console.error('🔴 Database Error:', err.message);
    return res.status(500).json({ 
      success: false, 
      msg: 'Gagal mengakses database',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined 
    });
  }
}