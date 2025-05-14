'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import { useRouter } from 'next/navigation';
import nookies from 'nookies';

interface User {
  id: number;
  user: string;
  pass: string;
  role: string;
}

export default function AdminPanel() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [keyword, setKeyword] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const [total, setTotal] = useState<number>(0);
  const [limit] = useState<number>(10);
  const [loading, setLoading] = useState<boolean>(false);

  const checkAuthToken = async () => {
    try {
      const res = await axios.get('/api/admin/auth', {
        withCredentials: true, // wajib agar cookie ikut terkirim
      });

      const user = res.data.user;

      if (user.role !== 'admin') {
        Swal.fire('Akses Ditolak', 'Kamu bukan admin!', 'error');
        router.push('/admin/login');
        return false;
      }

      return true;
    } catch (error) {
      Swal.fire('Unauthorized', 'Token tidak valid atau expired', 'error');
      router.push('/admin/login');
      return false;
    }
    
  };

  // 🔐 Verifikasi role saat load awal
  useEffect(() => {
    const verifyAdmin = async () => {
      const cookies = nookies.get();
      const admin_token = cookies.session_admin;
      try {
        const res = await axios.get('/api/admin/auth', {
          headers: {
            Authorization: `Bearer ${admin_token}`,
          },
          withCredentials: true
        });

        if (res.data.user.role !== 'admin') {
          Swal.fire('Akses Ditolak', 'Kamu bukan admin!', 'error');
          router.push('/admin/login');
        }
      } catch (err) {
        Swal.fire('Unauthorized', 'Silakan login terlebih dahulu.', 'error');
        router.push('/admin/login');
      }
    };

    verifyAdmin();
  }, []);
  
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await axios.get<{
        users: User[];
        total: number;
      }>('/api/list_user', {
        params: { search: keyword, page, limit },
      });

      setUsers(res.data.users);
      setTotal(res.data.total);
    } catch (err) {
      console.error(err);
      Swal.fire('Gagal', 'Gagal memuat data user', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const checkAndFetch = async () => {
      const isAuthValid = await checkAuthToken();  // Wait for the promise to resolve
      if (isAuthValid) {
        fetchUsers();
      }
    }
    checkAndFetch();
  }, [page, keyword]);

const handleCreateUser = async () => {
  const { value: formValues } = await Swal.fire({
    title: 'Create User',
    html: `
      <input id="swal-input-username" class="swal2-input" placeholder="Username" />
      <input id="swal-input-password" class="swal2-input" type="password" placeholder="Password" />
    `,
    focusConfirm: false,
    preConfirm: () => {
      const user = (document.getElementById('swal-input-username') as HTMLInputElement).value;
      const pass = (document.getElementById('swal-input-password') as HTMLInputElement).value;
      if (!user || !pass) {
        Swal.showValidationMessage('Username and password are required');
      }
      return { user, pass };
    },
    showCancelButton: true,
    cancelButtonText: 'Cancel',
    confirmButtonText: 'Create',
    confirmButtonColor: '#3085d6',
    cancelButtonColor: '#d33',
  });

  if (formValues) {
    const { user, pass } = formValues;
    console.log('New User:', user, pass);
    try {
      // Kirim data ke server menggunakan axios POST
      const response = await axios.post('/api/create', { user, pass });
      await fetchUsers();
      // Tanggapan dari server jika berhasil
      Swal.fire('Success', `User ${user} created successfully!`, 'success');
      console.log(response.data); // Response dari server
    } catch (error) {
      // Menangani error jika terjadi
      Swal.fire('Error', 'Failed to create user', 'error');
      console.error(error);
    }
  }
};

// Call handleCreateUser on button click or wherever needed


  const handleDelete = async (id: number) => {
    const confirm = await Swal.fire({
      title: 'Hapus User?',
      text: 'User akan dihapus permanen.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Ya, hapus!',
      cancelButtonText: 'Batal',
    });

    if (confirm.isConfirmed) {
      try {
        await axios.post('/api/delete', { id });
        Swal.fire('Dihapus', 'User berhasil dihapus.', 'success');
        fetchUsers();
      } catch (err) {
        Swal.fire('Gagal', 'Gagal menghapus user.', 'error');
      }
    }
  };

  const handleLogout = async () => {
    await axios.post('/api/logout');
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Admin Panel</h1>
          <div className="flex gap-2">
            <button
              onClick={handleCreateUser}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md"
            >
              Create User
            </button>
            {/* <button
              onClick={handleLogout}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md"
            >
              Logout
            </button> */}
          </div>
        </div>

        <div className="flex justify-between items-center mb-4">
          <input
            type="text"
            placeholder="Cari user..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            className="w-full md:w-1/3 px-4 py-2 border rounded-md dark:bg-gray-800 dark:border-gray-700"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full bg-white dark:bg-gray-800 border rounded-md">
            <thead className="bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200">
              <tr>
                <th className="px-4 py-2 text-left">Username</th>
                <th className="px-4 py-2 text-left">Password</th>
                <th className="px-4 py-2 text-left">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={3} className="text-center py-4">
                    Memuat...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={3} className="text-center py-4">
                    Tidak ada data.
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="border-t dark:border-gray-700">
                    <td className="px-4 py-2">{user.user}</td>
                    <td className="px-4 py-2">{user.pass}</td>
                    <td className="px-4 py-2">
                      <div className="flex gap-2">
                        <button
                          className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-md text-sm"
                        >
                          Edit
                        </button>
                        {user.role !== 'admin' && (
                          <button
                            onClick={() => handleDelete(user.id)}
                            className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-md text-sm"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex justify-between items-center mt-4">
          <p className="text-sm">
            Menampilkan {users.length} dari {total} user
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1 border rounded-md disabled:opacity-50"
            >
              Prev
            </button>
            <span className="px-2">Halaman {page}</span>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={users.length < limit}
              className="px-3 py-1 border rounded-md disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}