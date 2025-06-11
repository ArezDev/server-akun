import type { NextApiRequest, NextApiResponse } from 'next';
import { db } from "@/config/firebase";
import { Timestamp } from 'firebase-admin/firestore';
import axios from 'axios';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === 'POST') {
      const { cokis, userId } = req.body;

      // Validasi input
      if (!cokis || !userId) {
        return res.status(401).json({ message: 'userId tidak ditemukan...!' });
      }

      //Mysql
       const now = new Date();
       const year = now.getFullYear();
       const month = String(now.getMonth() + 1).padStart(2, '0');
       const day = String(now.getDate()).padStart(2, '0');
       let hours = now.getHours();
       const minutes = String(now.getMinutes()).padStart(2, '0');
       const seconds = String(now.getSeconds()).padStart(2, '0');
       const today = `${year}-${month}-${day}:${String(hours).padStart(2, '0')}:${minutes}:${seconds}`;
      // const [result] = await db.query('INSERT INTO FB (cokis, id_user, create_at) VALUES (?, ?, ?)', [cokis, userId, today]);
      // const [result2] = await db.query('INSERT INTO FB_Live (cokis, id_user, create_at) VALUES (?, ?, ?)', [cokis, userId, today]);
      // if ('affectedRows' in result && result.affectedRows > 0 || 'affectedRows' in result2 && result2.affectedRows > 0) {
      // // Trigger WebSocket ketika ada request POST ke /api/user/upload_akun
      // const io = (res.socket as any).server.io;
      // io.emit('upload_akun_triggered', { message: 'Akun data uploaded', cokis, userId });

      //   //kirim sukses upload cokis!
      //   return res.status(200).json({ 
      //     success: true, 
      //     cokis: cokis, 
      //     message: 'Cokis sukses di tambahkan' 
      //   });

      // } else {
      //   return res.status(500).json({
      //     success: false,
      //     message: 'Gagal menambahkan cokis',
      //   });
      // }

      const check_permissions = await db.collection('users')
      .where('username', '==', userId).where('canUpload', '==', true).get();

      if (check_permissions.empty) {
        return res.status(401).json({error: 'You dont have permissions to access..'});
      }

      //const docId = `FB-${userId}`;
      const sendFB = db.collection('fb_akun').doc();
      sendFB.set({
        fbne: userId,
        cokis: cokis,
        created_at: Timestamp.now()
      },{merge:true});
      // Kirim ke socket
      await axios.post(`${process.env.NEXT_PUBLIC_SOCKET_URL}/broadcast`, {
        event: "send-cokis",
        payload: {
          message: `User: ${userId} send cokis..`,
          fb: cokis,
        }
      });
      
      return res.status(200).json({success: true, cokis: cokis});
    }

    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  } catch (error) {
    console.error('Database error:', error);
    return res.status(500).json({ error: 'Gagal mengakses database' });
  }
}