import type { NextApiRequest, NextApiResponse } from 'next';
//import { db } from "@/config/firebase";
import { Timestamp } from 'firebase-admin/firestore';
import bcrypt from 'bcryptjs';
import db from '@/config/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === 'POST') {
        const { user, pass, canGet, canUpload } = req.body;

        if (!user || typeof user !== 'string') {
            return res.status(400).json({ error: 'Field akun harus berupa string' });
        }
        if (!pass || typeof pass !== 'string') {
            return res.status(400).json({ error: 'Field "pass" harus berupa string' });
        }

        //hash password
        const ngamakno_password = await bcrypt.hash(pass, 15);

        //Firebase
        //const createMember = db.collection('users').doc();
        // await createMember.set({
        //   username: user,
        //   password: ngamakno_password,
        //   canGet: canGet,
        //   canUpload: canUpload,
        //   role: 'member',
        //   created_at: Timestamp.now()
        // }, {merge: true});

        //Mysql
        // Assuming db is a mysql2 connection or pool
        const [result] = await db.execute(
          `INSERT INTO users (username, password, canGet, canUpload, role, created_at) VALUES (?, ?, ?, ?, ?, NOW())`,
          [user, ngamakno_password, canGet ? 1 : 0, canUpload ? 1 : 0, 'member']
        );
        if ((result as any).affectedRows === 1) {
          return res.status(200).json({ success: true, message: `User: ${user} ditambahkan!` });
        } else {
          return res.status(401).json({ success: false, message: "Gagal membuat user" });
        }
        
    }
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  } catch (error) {
    console.error('Database error:', error);
    return res.status(500).json({ error: 'Gagal mengakses database' });
  }
}