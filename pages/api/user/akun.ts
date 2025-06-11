import type { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/config/firebase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === 'GET') {
      const { user } = req.query;
      if (!user) {
        return res.status(401).end(`Missing user query.`);
      }
      //Mysql
      // const [rows] = await db.query('SELECT cokis FROM FB_Live WHERE FB_Live.id_user = ? ORDER BY id DESC', [ user ]);
      // const akunList = (rows as any[]).map(row => row.cokis).join('\n');

      const getFB = await db.collection('fb_akun')
        .where('fbne', '==', user)
        .orderBy('created_at', 'desc')
        .get();

      if (getFB.empty) {
        return res.status(200).json([]);
      }

      const cokisList: string[] = [];
      getFB.forEach((doc) => {
        const data = doc.data();
        if (data.cokis) {
          cokisList.push(data.cokis);
        }
      });

      return res.status(200).json({ fb:cokisList.join('\n') });

    } else if (req.method === 'DELETE') {
      const { user } = req.query;
      if (!user || Array.isArray(user)) {
        return res.status(400).json({ error: 'Invalid or missing id parameter' });
      }
      const getFB = await db.collection('fb_akun').where('fbne', '==', user).get();
      if (getFB.empty) {
        console.log('Tidak ada dokumen dengan fbne:', user);
        return res.status(405).json({error: `Tidak ada dokumen dengan fbne: ${user}`});
      }
      const batch = db.batch();
      getFB.docs.forEach(doc => {
        batch.delete(doc.ref);
      });
      await batch.commit();
      return res.status(200).json({ success: true, msg: 'Delete akun success..!' });
    }

    res.setHeader('Allow', ['GET']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  } catch (error) {
    console.error('Database error:', error);
    return res.status(500).json({ error: 'Gagal mengakses database' });
  }
}