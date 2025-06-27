import { NextApiRequest, NextApiResponse } from 'next';
import nookies from 'nookies';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Menghapus cookie yang digunakan untuk autentikasi (misalnya "token" atau "user_id")
    //nookies.destroy({ res }, 'sessionid'); // Ganti 'user_id' dengan nama cookie yang kamu gunakan
    //nookies.destroy({ res }, 'sessionid', { path: '/', domain: 'localhost' });
    nookies.destroy({ res }, 'sessionid', { path: '/' });

    // Menghapus session atau data yang terkait di sisi server (jika ada)

    // Mengembalikan respon sukses
    return res.status(200).json({ message: 'Logout berhasil' });
  } catch (error) {
    console.error('Logout error:', error);
    return res.status(500).json({ error: 'Terjadi kesalahan saat logout' });
  }
}
