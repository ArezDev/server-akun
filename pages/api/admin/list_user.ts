import db from '@/config/db';
import type { NextApiRequest, NextApiResponse } from 'next';
//import { db } from "@/config/firebase";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === 'GET') {
      //Firebase
      // const dataUser: { 
      //   id: string; 
      //   username: string; 
      //   password: string;
      //   canUpload: boolean;
      //   canGet: boolean;
      //   role: string;
      //   created_at: any;
      // }[] = [];
      // const list_users = await db.collection('users')
      // .where('role', '==', 'member')
      // .orderBy('created_at', 'asc')
      // .get();
      // list_users.forEach((docs)=> {
      //   const data = docs.data();
      //   const createdAt = data.created_at;
      //   dataUser.push({
      //     id: docs.id,
      //     username: data.username,
      //     password: data.password,
      //     canGet: data.canGet,
      //     canUpload: data.canUpload,
      //     role: data.role,
      //     created_at: createdAt.toDate()
      //   });
      // });

      //Mysql
      // Query users with role 'member' from MySQL
      const [rows] = await db.execute(
        'SELECT id, username, password, canUpload, canGet, role, created_at FROM users WHERE role = ? ORDER BY created_at ASC',
        ['member']
      );
      const dataUser = (rows as any[]).map(user => ({
        id: user.id,
        username: user.username,
        password: user.password,
        canUpload: !!user.canUpload,
        canGet: !!user.canGet,
        role: user.role,
        created_at: user.created_at
      }));
      // Mengembalikan data user yang ditemukan
      return res.status(200).json({ users: dataUser });
    }
    res.setHeader('Allow', ['UPDATE']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  } catch (error) {
    console.error('Database error:', error);
    return res.status(500).json({ error: 'Gagal mengakses database' });
  }
}