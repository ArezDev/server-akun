import type { NextApiRequest, NextApiResponse } from 'next';
import db from "@/config/db";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { id } = req.body;

  if (!id) {
    return res.status(400).json({ message: 'ID tidak boleh kosong' });
  }

  try {
    const [result] = await db.execute('DELETE FROM id_user WHERE id = ?', [id]);

    return res.status(200).json({ message: 'User berhasil dihapus', result });
  } catch (error) {
    console.error('Error deleting user:', error);
    return res.status(500).json({ message: 'Gagal menghapus user' });
  }
}