// components/CardList.tsx
import axios from 'axios';
import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import Swal from 'sweetalert2';

interface CardListProps {
  data: string;
}

const CardList: React.FC<CardListProps> = ({ data }) => {

  const router = useRouter();
  const [accounts, setAccounts] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [userData, setUserData] = useState<{ user: string; role: string } | null>(null);

  // 🔐 Verifikasi user
  useEffect(() => {
  const checkUser = async () => {
    try {
      const res = await axios.get('/api/user/auth', { withCredentials: true });
      const user = res.data.user;
      if (user.role !== 'user') {
        Swal.fire('Akses Ditolak', 'Who are you?', 'error');
        router.push('/');
        return;
      }
      setUserData(user);
      fetchAccounts();
    } catch (error: any) {
      if (error.response && error.response.status === 401) {
        Swal.fire('Unauthorized', error.response.data.message, 'error');
        router.push('/');
        return false;
      }
      
    }
  };

  checkUser();
}, []);

  // Ambil data akun dari API saat halaman dimuat
  const fetchAccounts = async () => {
    try {
      setLoading(true);
      const res = await axios.get<{ fb: string }>('/api/akun');
      const akunText = res.data.fb || '';
      setAccounts(akunText);
    } catch (err) {
      console.error('Gagal memuat data akun:', err);
      Swal.fire('Error', 'Gagal memuat data akun', 'error');
    } finally {
      setLoading(false);
    }
  };

  

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-100 p-6 text-black">
          <div className="max-w-4xl mx-auto">
            
    
            {loading ? (
              <div className="text-center py-10">Loading akun...</div>
            ) : (
              <>
                <textarea
                  className="w-full h-60 p-4 border border-gray-300 rounded-md dark:bg-gray-800 dark:border-gray-700 resize-none"
                  value={data}
                  readOnly
                  wrap="off"
                />
    
                
              </>
            )}
          </div>
        </div>
  );
};

export default CardList;