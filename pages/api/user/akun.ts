import { prisma } from '@/lib/prisma';
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { user } = req.query;

    // Proteksi awal soko query sing kosong utawa array
    if (!user || Array.isArray(user)) {
      return res.status(401).json({ message: 'Missing or invalid user query.' });
    }

    if (req.method === 'GET') {
      // 1. Njupuk kabeh cokis berdasarkan fbne (user)
      const rows = await prisma.fbAkun.findMany({
        where: { fbne: user },
        orderBy: { created_at: 'desc' },
        select: { cokis: true } // Mung njupuk kolom cokis wae
      });

      if (rows.length === 0) {
        return res.status(200).json([]);
      }

      // Map dadi string array lan gabung dadi siji nggo newline
      const cokisList = rows.map(row => row.cokis).filter(Boolean);
      return res.status(200).json({ fb: cokisList.join('\n') });

    } else if (req.method === 'DELETE') {
      // 2. Mbusak kabeh akun sing duwe fbne podo karo user
      const result = await prisma.fbAkun.deleteMany({
        where: { fbne: user }
      });

      if (result.count === 0) {
        console.log('Tidak ada dokumen dengan fbne:', user);
        return res.status(404).json({ success: false, msg: `Tidak ada dokumen dengan fbne: ${user}` });
      }

      return res.status(200).json({ success: true, msg: 'Delete akun success..!' });
    }

    // Handle method liyane
    res.setHeader('Allow', ['GET', 'DELETE']);
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