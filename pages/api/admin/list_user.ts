import { prisma } from '@/lib/prisma';
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === 'GET') {
      // 1. Query kabeh user sing role-ne 'member'
      const users = await prisma.user.findMany({
        where: {
          role: 'member',
        },
        orderBy: {
          created_at: 'asc', // Urutno soko sing paling lawas
        },
        // Pilih kolom sing diperlokno wae (opsional, tapi luwih apik)
        select: {
          id: true,
          username: true,
          password: true,
          canUpload: true,
          canGet: true,
          role: true,
          created_at: true,
        },
      });

      // 2. Konversi format (yen pancen frontend-mu njaluk boolean murni)
      // Amarga neng MySQL 'canUpload' iku Int (0/1), kowe iso nggawe ngene:
      const dataUser = users.map((user) => ({
        ...user,
        canUpload: !!user.canUpload,
        canGet: !!user.canGet,
      }));

      return res.status(200).json({ users: dataUser });
    }

    res.setHeader('Allow', ['GET']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);

  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error('🔴 Database Error:', error.message);
    }
    return res.status(500).json({ success: false, msg: 'Gagal mengambil data user' });
  }
}