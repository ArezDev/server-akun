import type { NextApiRequest, NextApiResponse } from 'next';
import db from '@/config/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === 'GET') {
      const { user, total } = req.query;

      if (!user || !total) {
        return res.status(401).json({ message: 'Missing query...!' });
      }

      // Validasi input
      if (!user) {
        return res.status(401).json({ message: 'user tidak ditemukan...!' });
      }

      //Mysql
      // Check permissions in MySQL
      const [userRows] = await db.execute(
        'SELECT canGet FROM users WHERE username = ? AND canGet = 1 LIMIT 1',
        [user]
      );

      if (!Array.isArray(userRows) || userRows.length === 0) {
        return res.status(401).json({ error: 'You dont have permissions to access..' });
      }

      // Insert into fb_akun table
      const [getAkun] = await db.execute(
        `SELECT cokis FROM fb_akun WHERE fbne = ? ORDER BY created_at DESC LIMIT ${total}`,
        [user]
      );

      if (!getAkun || (Array.isArray(getAkun) && getAkun.length === 0)) {
      return res.status(200).json([]);
      }
      
      const cokisList: string[] = (getAkun as any[]).map(row => row.cokis).filter(Boolean);

      const [delAkun]: any = await db.execute(
      `DELETE FROM fb_akun WHERE fbne = ? ORDER BY created_at DESC LIMIT ${total}`,
      [user]
      );

      if (delAkun.affectedRows === 0) {
      console.log('Tidak ada dokumen dengan fbne:', user);
      return res.status(405).json({ error: `Tidak ada dokumen dengan fbne: ${user}` });
      }

      return res.status(200).json({ akun: cokisList.join('\n') });
      
    }
    res.setHeader('Allow', ['GET']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  } catch (error) {
    console.error('Database error:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: `Gagal mengakses database: ${errorMessage}` });
  }
}