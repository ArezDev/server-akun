'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import Swal from 'sweetalert2';
import { FaUser, FaSyncAlt, FaUpload, FaCopy, FaTrash, FaSave } from 'react-icons/fa';
import io from 'socket.io-client';
import { CgLogOut } from "react-icons/cg";
import { closeSwal, showLoadingSwal } from '@/components/base/Loading';


const Dashboard: React.FC = () => {
  const router = useRouter();
  const [accounts, setAccounts] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [userData, setUserData] = useState<{ id: number; user: string; role: string; canGet: boolean; canUpload: boolean; } | null>(null);
  const isLoading = useRef(false);
  
  useEffect(() => {
  
  //websocket Initialized
  const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL, {
      transports: ["websocket"],
  });

  socket.on('send-cokis', async (data) => {
      console.log('Event diterima:', data);

      if (data?.fb && !isLoading.current) {

        if (isLoading.current) {
            console.log("⏳ Masih memproses, abaikan event baru.");
            return; // cegah eksekusi berulang
        }

        //set Loading akun..
        isLoading.current = true;

        // Tampilkan loading
        showLoadingSwal('Mendapatkan akun...');

        try {
          console.log(userData)
          // Get user ID dari auth API
          const authRes = await axios.get('/api/user/auth', { withCredentials: true });
          const userId = authRes.data?.user?.user;

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
          closeSwal();
          Swal.fire('Gagal', 'Terjadi kesalahan saat mendapatkan akun.', 'error');
        } finally {
          setTimeout(() => {
            isLoading.current = false; // beri waktu delay agar tidak langsung terbuka untuk event berikutnya
            console.log("✅ Selesai, siap terima event lagi.");
            closeSwal();
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
      if (user.role !== 'member') {
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
      if (getUserId.data?.user?.user) {
        const res = await axios.get<{ fb: string }>('/api/user/akun', {
          params: {
            user: getUserId.data.user.user
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
      Swal.fire({
        icon: 'success',
        title: `Tersalin!`,
        text: 'Data akun telah disalin.',
        showConfirmButton: false,
        timer: 1000
      });
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
        const deleteAkun = await axios.delete('/api/user/akun', { params: { user: getUserId.data?.user?.user } });
        if (deleteAkun.data?.success === true) {
          Swal.fire('Berhasil', 'Semua akun telah dihapus.', 'success');
          setAccounts('');
        }

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
  
  function ActionButton({
    onClick,
    icon,
    children,
    color = "blue",
  }: {
    onClick: () => void;
    icon: React.ReactNode;
    children: React.ReactNode;
    color?: "blue" | "green" | "orange" | "red";
  }) {
    const colorMap = {
      blue: "bg-blue-500 hover:bg-blue-600",
      green: "bg-green-500 hover:bg-green-600",
      orange: "bg-orange-500 hover:bg-orange-600",
      red: "bg-red-500 hover:bg-red-600",
    };

    return (
      <button
        onClick={onClick}
        className={`flex items-center gap-2 ${colorMap[color]} text-white px-4 py-2 rounded-lg shadow-sm transition`}
      >
        {icon}
        {children}
      </button>
    );
  }


  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-100">
      {/* Navbar */}
      <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-lg font-semibold">
            <FaUser className="text-blue-600" />
            <span className="text-gray-800 dark:text-gray-100">{userData?.user} | Total Akun: {accounts.split('\n').length}</span>
          </div>
          
          <button
            onClick={HandleLogout}
            className="text-red-500 hover:text-red-600 transition text-xl"
            title="Logout"
          >
            <CgLogOut />
          </button>
        </div>
      </nav>

      {/* Page content */}
      <main className="max-w-4xl mx-auto py-8 px-4 space-y-6">
        {loading ? (
          // <div className="text-center py-10 text-gray-500 dark:text-gray-400">
          //   Loading akun...
          // </div>
          <>
          {/* Akun textarea */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg 
                border border-gray-200 dark:border-gray-700"
            >
              <textarea
                className="w-full h-60 p-4 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-300 
                dark:border-gray-700 text-sm font-mono resize-none overflow-y-auto 
                scrollbar-thin scrollbar-thumb-blue-500 scrollbar-track-gray-100"
                value={"Loading akun..."}
                readOnly
                wrap="off"
              />
              </div>

          {/* Buttons */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-lg 
            flex flex-wrap justify-center gap-3 mb-3">
              <ActionButton onClick={handleCopy} icon={<FaCopy />} color="green">Copy</ActionButton>
              <ActionButton onClick={handleDelete} icon={<FaTrash />} color="red">Delete</ActionButton>
              <ActionButton onClick={handleExport} icon={<FaSave />} color="orange">Save</ActionButton>
              <ActionButton onClick={fetchAccounts} icon={<FaSyncAlt />} color="blue">Reload</ActionButton>
              <ActionButton onClick={HandleUpload} icon={<FaUpload />} color="blue">Upload Akun</ActionButton>
            </div>
          </>
        ) : (
          <>
          {/* Akun textarea */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg 
                border border-gray-200 dark:border-gray-700"
            >
              <textarea
                className="w-full h-60 p-4 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-300 
                dark:border-gray-700 text-sm font-mono resize-none overflow-y-auto 
                scrollbar-thin scrollbar-thumb-blue-500 scrollbar-track-gray-100"
                value={accounts}
                readOnly
                wrap="off"
              />
              </div>

          {/* Buttons */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-lg 
            flex flex-wrap justify-center gap-3 mb-3">
              <ActionButton onClick={handleCopy} icon={<FaCopy />} color="green">Copy</ActionButton>
              <ActionButton onClick={handleDelete} icon={<FaTrash />} color="red">Delete</ActionButton>
              <ActionButton onClick={handleExport} icon={<FaSave />} color="orange">Save</ActionButton>
              <ActionButton onClick={fetchAccounts} icon={<FaSyncAlt />} color="blue">Reload</ActionButton>
              <ActionButton onClick={HandleUpload} icon={<FaUpload />} color="blue">Upload Akun</ActionButton>
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default Dashboard;