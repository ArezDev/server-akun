import type { NextApiRequest, NextApiResponse } from 'next';
import db from "@/config/db";
import bcrypt from 'bcryptjs';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === 'POST') {
        const { user, pass } = req.body;

        if (!user || typeof user !== 'string') {
            return res.status(400).json({ error: 'Field akun harus berupa string' });
        }
        if (!pass || typeof pass !== 'string') {
            return res.status(400).json({ error: 'Field "pass" harus berupa string' });
        }

        //hash password
        const ngamakno_password = await bcrypt.hash(pass, 15);

        //ekseskusi DATABASE!
        await db.query('INSERT INTO id_user (user, pass) VALUES (?, ?)', [user, ngamakno_password]);
        return res.status(200).json({ message: `User: ${user} ditambahkan!` });
    }
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  } catch (error) {
    console.error('Database error:', error);
    return res.status(500).json({ error: 'Gagal mengakses database' });
  }
}