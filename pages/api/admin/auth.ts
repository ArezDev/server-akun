import type { NextApiRequest, NextApiResponse } from 'next';
import jwt from 'jsonwebtoken';
import nookies from 'nookies';

const SECRET_KEY = process.env.JWT_SECRET;
if (!SECRET_KEY) {
  throw new Error('JWT_SECRET is not defined in the environment variables.');
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Ambil token dari cookie
    const cookies = nookies.get({ req });
    const token = cookies.session_admin;

    if (!token) {
      return res.status(401).json({ success: false, message: 'Token tidak ditemukan' });
    }

    // Verifikasi token
    const decoded = jwt.verify(token, SECRET_KEY as string);
    return res.status(200).json({ success: true, user: decoded });
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Token tidak valid atau expired' });
  }
}
