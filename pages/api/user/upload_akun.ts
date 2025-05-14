import type { NextApiRequest, NextApiResponse } from 'next';
import db from "@/config/db";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === 'POST') {
      const { cokis, userId } = req.body;

      // Validasi input
      if (!cokis || !userId) {
        return res.status(400).json({ message: 'userId tidak ditemukan...!' });
      }

      // Buat tanggal saat ini
      //const today = new Date().toISOString().split('T')[0]; // Format: YYYY-MM-DD
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');

      let hours = now.getHours();
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const seconds = String(now.getSeconds()).padStart(2, '0');
      // const ampm = hours >= 12 ? 'PM' : 'AM';
      // hours = hours % 12;
      // hours = hours ? hours : 12; // jam 0 jadi 12

      const today = `${year}-${month}-${day}:${String(hours).padStart(2, '0')}:${minutes}:${seconds}`;

      console.log(today); // ➜ contoh: 2025-05-14 : 02:30 PM

      const [result] = await db.query('INSERT INTO FB (cokis, id_user, create_at) VALUES (?, ?, ?)', [cokis, userId, today]);
      const [result2] = await db.query('INSERT INTO FB_Live (cokis, id_user, create_at) VALUES (?, ?, ?)', [cokis, userId, today]);
      if ('affectedRows' in result && result.affectedRows > 0 || 'affectedRows' in result2 && result2.affectedRows > 0) {
        
        // Trigger WebSocket ketika ada request POST ke /api/user/upload_akun
        const io = (res.socket as any).server.io;
        io.emit('upload_akun_triggered', { message: 'Akun data uploaded', cokis, userId });

        //kirim sukses upload cokis!
        return res.status(200).json({ 
          success: true, 
          cokis: cokis, 
          message: 'Cokis sukses di tambahkan' 
        });

      } else {
        return res.status(500).json({
          success: false,
          message: 'Gagal menambahkan cokis',
        });
      }
      
    }

    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  } catch (error) {
    console.error('Database error:', error);
    return res.status(500).json({ error: 'Gagal mengakses database' });
  }
}