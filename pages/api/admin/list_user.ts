import type { NextApiRequest, NextApiResponse } from 'next';
import db from "@/config/db";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // if (req.method === 'GET') {

    //     const [rows] = await db.query('SELECT id, user, pass FROM id_user');
    //     return res.status(200).json({ users: rows });
    // }
    if (req.method === 'GET') {
      const { search = '', page = 1, limit = 10 } = req.query;

      // Validasi dan pastikan page dan limit adalah angka
      const pageNumber = Math.max(1, Number(page)); // default ke 1 jika page tidak valid
      const limitNumber = Math.max(1, Number(limit)); // default ke 10 jika limit tidak valid

      // Menggunakan wildcard '%' untuk mencari user yang mengandung keyword dari 'search'
      const keyword = `%${search}%`;

      // Query untuk mencari user yang cocok dengan parameter 'search' dan untuk pagination
      const [rows] = await db.query(
        //'SELECT id, user, pass FROM id_user WHERE user LIKE ? LIMIT ? OFFSET ?',
        `SELECT id, user, sambel 
          FROM id_user 
          WHERE user LIKE ? AND role != 'admin' 
          LIMIT ? OFFSET ?`,
        [keyword, limitNumber, (pageNumber - 1) * limitNumber]
      );

      // Mengembalikan data user yang ditemukan
      return res.status(200).json({ users: rows });
    }
    res.setHeader('Allow', ['UPDATE']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  } catch (error) {
    console.error('Database error:', error);
    return res.status(500).json({ error: 'Gagal mengakses database' });
  }
}