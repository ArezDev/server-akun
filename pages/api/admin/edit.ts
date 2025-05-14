import type { NextApiRequest, NextApiResponse } from 'next';
import bcrypt from 'bcryptjs';
import db from "@/config/db";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { user, pass, id } = req.body;

  if (!user) {
    return res.status(400).json({ message: 'User tidak boleh kosong' });
  }
  //hash password
  const ngamakno_password = await bcrypt.hash(pass, 15);

  try {
    const [result] = await db.execute(
        `UPDATE id_user 
            SET user = ?, pass = ?, sambel = ?
                WHERE id_user.id = ?`,
    [user, ngamakno_password, pass, id]);

    return res.status(200).json({ message: 'User berhasil diedit!~', result });
  } catch (error) {
    console.error('Error modifikasi user:', error);
    return res.status(500).json({ message: 'Gagal edit user' });
  }
}