import type { NextApiRequest, NextApiResponse } from 'next';
import bcrypt from 'bcryptjs';
import { db } from "@/config/firebase";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { user, pass, id, canGet, canUpload } = req.body;

  if (!id) {
    return res.status(400).json({ message: 'ID tidak boleh kosong' });
  }
  if (!user && !pass) {
    return res.status(400).json({ message: 'Minimal isi salah satu field (user atau pass)' });
  }

  try {
    const updateData: Record<string, any> = {};

    if (user) {
      updateData.username = user;
    }

    if (pass) {
      const hashed = await bcrypt.hash(pass, 15);
      updateData.password = hashed;
    }

    updateData.canGet = !!canGet;
    updateData.canUpload = !!canUpload;

    await db.collection('users').doc(id).set(updateData, { merge: true });

    return res.status(200).json({ success: true, message: 'User berhasil diedit!' });
  } catch (error) {
    console.error('Error modifikasi user:', error);
    return res.status(500).json({ message: 'Gagal edit user' });
  }
}
