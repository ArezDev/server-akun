import type { NextApiRequest, NextApiResponse } from 'next';
import db from '@/config/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === 'GET') {
      const { user } = req.query;
      const [rows] = await db.query('SELECT cokis FROM FB_Live WHERE FB_Live.id_user = ? ORDER BY id DESC', [ user ]);
      const akunList = (rows as any[]).map(row => row.cokis).join('\n');
      return res.status(200).json({ fb: akunList });
    }

    res.setHeader('Allow', ['GET']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  } catch (error) {
    console.error('Database error:', error);
    return res.status(500).json({ error: 'Gagal mengakses database' });
  }
}