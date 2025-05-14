import axios from "axios";
import router from "next/router";
import { useEffect, useState } from "react";
import { FaCopy, FaUpload, FaTrash, FaSyncAlt } from "react-icons/fa";
import Swal from "sweetalert2";

interface CardListProps {
  data?: string;
}

const Footer: React.FC<CardListProps> = ({ data }) => {
    
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
            await axios.delete('/api/akun');
            Swal.fire('Berhasil', 'Semua akun telah dihapus.', 'success');
            setAccounts('');
          } catch (err) {
            Swal.fire('Gagal', 'Tidak dapat menghapus akun.', 'error');
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
      
    return (
            <div className="flex flex-wrap gap-4 mt-4">
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-2 bg-green-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md"
                  >
                    <FaCopy/>
                    Salin
                  </button>
                  <button
                    onClick={handleExport}
                    className="flex items-center gap-2 bg-orange-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md"
                  >
                    <FaUpload/>
                    Ekspor TXT
                  </button>
                  <button
                    onClick={handleDelete}
                    className="flex items-center gap-2 bg-red-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md"
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
            </div>
    );
};

export default Footer;