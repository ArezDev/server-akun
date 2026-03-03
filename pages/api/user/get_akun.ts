import { prisma } from '@/lib/prisma';
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === 'GET') {
      const { user, total } = req.query;

      if (!user || !total) {
        return res.status(401).json({ message: 'Missing query...!' });
      }

      const limit = parseInt(total as string);

      // 1. Check permissions (canGet)
      const userData = await prisma.user.findFirst({
        where: {
          username: user as string,
          canGet: 1,
        },
        select: { canGet: true }
      });

      if (!userData) {
        return res.status(401).json({ error: 'You dont have permissions to access..' });
      }

      // 2. Ambil data cokis sisan ID-ne (nggo bahan hapus)
      const accounts = await prisma.fbAkun.findMany({
        where: { fbne: user as string },
        orderBy: { created_at: 'desc' },
        take: limit,
        select: { id: true, cokis: true } // Njupuk ID nggo query hapus sakwise iki
      });

      if (accounts.length === 0) {
        return res.status(200).json([]);
      }

      // 3. Pisahno cokis nggo di-return
      const cokisList = accounts.map(row => row.cokis).filter(Boolean);
      
      // 4. Hapus data sing wis dijupuk mau (berdasarkan ID)
      const idsToDelete = accounts.map(row => row.id);
      
      const deleteResult = await prisma.fbAkun.deleteMany({
        where: {
          id: { in: idsToDelete }
        }
      });

      if (deleteResult.count === 0) {
        console.log('Tidak ada dokumen sing dibusak kanggo fbne:', user);
        return res.status(405).json({ error: `Gagal mbusak data: ${user}` });
      }

      // Return hasil akhir
      return res.status(200).json({ akun: cokisList.join('\n') });
    }

    res.setHeader('Allow', ['GET']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);

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