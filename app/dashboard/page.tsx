'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import Swal from 'sweetalert2';
import { FaUser, FaSyncAlt, FaUpload, FaCopy, FaTrash, FaSave } from 'react-icons/fa';
import io from 'socket.io-client';
import { CgLogOut } from "react-icons/cg";


const Dashboard: React.FC = () => {
  const router = useRouter();
  const [accounts, setAccounts] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [userData, setUserData] = useState<{ id: number; user: string; role: string } | null>(null);
  const isLoading = useRef(false);
  
  useEffect(() => {

  // Connect ke WebSocket server
  // const socket = io('/api/socket', {
  //   path: '/socket.io', // This must match the server's path
  // });
  const socket = io('http://localhost:3000');

  socket.on('upload_akun_triggered', async (data) => {
      console.log('Event diterima:', data);

      if (data?.cokis && !isLoading.current) {

        if (isLoading.current) {
            console.log("⏳ Masih memproses, abaikan event baru.");
            return; // cegah eksekusi berulang
        }

        //set Loading akun..
        isLoading.current = true;

        // Tampilkan loading
        Swal.fire({
          title: 'Mendapatkan akun...',
          text: 'Tunggu sebentar',
          allowOutsideClick: false,
          didOpen: () => {
            Swal.showLoading();
          },
        });

        try {
          // Get user ID dari auth API
          const authRes = await axios.get('/api/user/auth', { withCredentials: true });
          const userId = authRes.data?.user?.id;

          if (!userId) throw new Error('User ID tidak ditemukan');

          // Get akun dengan user ID
          const akunRes = await axios.get<{ fb: string }>('/api/user/akun', {
            params: { user: userId },
          });

          const akunText = akunRes.data?.fb || '';
          if (akunText) {
            setAccounts(akunText);
            //fetchAccounts();
          }

        } catch (error) {
          console.error('Gagal mengambil akun:', error);
          Swal.close();
          Swal.fire('Gagal', 'Terjadi kesalahan saat mendapatkan akun.', 'error');
        } finally {
          setTimeout(() => {
            isLoading.current = false; // beri waktu delay agar tidak langsung terbuka untuk event berikutnya
            console.log("✅ Selesai, siap terima event lagi.");
            Swal.close();
            fetchAccounts();
          }, 2000); // delay sesuai dengan swal success timer
        }
      }
    });

  
  //handle WebSocket
  socket.on('connect', () => {
      console.log('Connected to WebSocket server' );
      //setIsConnected(true);
    });

    // Listen for disconnect event
    socket.on('disconnect', () => {
      console.log('Disconnected from WebSocket server');
      //setIsConnected(false);
    });

// 🔐 Verifikasi user
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
    } catch (error: unknown) {
      if (axios.isAxiosError(error) && error.response && error.response.status === 401) {
        console.log(error.message);
        Swal.fire('Unauthorized', error.response.data.message, 'error');
        router.push('/');
        return false;
      }
      
    }
  };

  checkUser();
  // Cleanup on unmount
    return () => {
      socket.disconnect();
    };
}, []);

  // Ambil data akun dari API saat halaman dimuat
  const fetchAccounts = async () => {
    try {
      setLoading(true);
      // get user id
      const getUserId = await axios.get('/api/user/auth', { withCredentials: true });
      //get akun dengan user id
      if (getUserId.data.user.id) {
        const res = await axios.get<{ fb: string }>('/api/user/akun', {
          params: {
            user: getUserId.data.user.id
          },
        });
        const akunText = res.data.fb || '';
        setAccounts(akunText);
      }
      
    } catch (err) {
      console.error('Gagal memuat data akun:', err);
      Swal.fire('Error', 'Gagal memuat data akun', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Salin akun ke clipboard
  const handleCopy = () => {
    navigator.clipboard.writeText(accounts).then(() => {
      Swal.fire('Tersalin!', 'Data akun telah disalin.', 'success');
    });
  };

  // Hapus akun dari database
  const handleDelete = async () => {
    const confirmResult = await Swal.fire({
      title: 'Yakin ingin menghapus?',
      text: 'Data akun akan dihapus permanen.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Ya, hapus!',
      cancelButtonText: 'Batal',
    });

    if (confirmResult.isConfirmed) {
      try {
        const getUserId = await axios.get('/api/user/auth', { withCredentials: true });
        await axios.delete('/api/user/akun', { params: { id: getUserId.data.user.id } });
        Swal.fire('Berhasil', 'Semua akun telah dihapus.', 'success');
        setAccounts('');
      } catch (error) {
        if (axios.isAxiosError(error) && error.response && error.response.status === 401) {
          console.log(error.message);
          Swal.fire('Gagal', 'Tidak dapat menghapus akun.', 'error');
        }
        
      }
    }
  };

  // Ekspor ke file teks
  const handleExport = () => {
    const filename = `akun-${new Date().toISOString().split('T')[0]}.txt`;
    const blob = new Blob([accounts], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  const HandleUpload = () => {
    router.push('/upload');
  };

   const HandleLogout = async () => {
    try {
      // Memanggil API logout
      const response = await axios.post('/api/user/logout');

      if (response.data.message === 'Logout berhasil') {
        // Menampilkan pesan sukses
        Swal.fire('Sukses', 'Anda telah berhasil logout', 'success');
        
        // Mengarahkan ulang ke halaman utama atau halaman login
        router.push('/');
      }
    } catch (error) {
      console.error('Logout error:', error);
      Swal.fire('Gagal', 'Terjadi kesalahan saat logout', 'error');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-100 p-6 text-black">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <FaUser className='text-blue-600' />Dashboard Akun {userData?.user}
          </h1>
          {/* <p>Websoket saiki: {isConnected ? 'Connected' : 'Disconnected'}</p> */}
          <button
            onClick={HandleLogout}
            className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md"
          >
          <CgLogOut />

          </button>
        </div>

        {loading ? (
          <div className="text-center py-10">Loading akun...</div>
        ) : (
          <>
            <textarea
              className="w-full h-60 p-4 border border-gray-300 rounded-md dark:bg-gray-800 dark:border-gray-700 resize-none overflow-y-auto scrollbar-thin scrollbar-thumb-blue-500 scrollbar-track-gray-700 scrollbar-rounded-md"
              //className="w-full h-60 p-4 border border-gray-300 rounded-md dark:bg-gray-800 dark:border-gray-700 resize-none"
              value={accounts}
              readOnly
              wrap="off"
            />

            <div className="text-center flex flex-wrap gap-4 mt-4">
              <button
                onClick={handleCopy}
                className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md"
              >
                <FaCopy/>
                Salin
              </button>
              <button
                onClick={handleExport}
                className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-md"
              >
                <FaSave />
                Ekspor TXT
              </button>
              <button
                onClick={handleDelete}
                className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md"
              >
                <FaTrash/>
                Hapus Semua
              </button>
              <button
                onClick={fetchAccounts}
                className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md"
              >
                <FaSyncAlt />
                Reload Akun
              </button>
              <button
                onClick={HandleUpload}
                className="flex items-center gap-2 bg-blue-500 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
              >
                <FaUpload />
                Upload Akun
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Dashboard;