'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import { showLoadingSwal } from '@/components/base/Loading';
import { useRouter } from 'next/navigation';
import nookies from 'nookies';
import { FaEdit, FaPlus, FaTrash } from 'react-icons/fa';
import { FaUserShield } from 'react-icons/fa6';

interface User {
  id: number;
  user: string;
  pass: string;
  role: string;
  sambel: string;
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
      }>('/api/admin/list_user', {
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
      const response = await axios.post('/api/admin/create', { user, pass });
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
        await axios.post('/api/admin/delete', { id });
        Swal.fire('Dihapus', 'User berhasil dihapus.', 'success');
        fetchUsers();
      } catch (err) {
        Swal.fire('Gagal', 'Gagal menghapus user.', 'error');
      }
    }
  };

  const EditUser = async (user: User) => {
    const { value: formValues } = await Swal.fire({
      title: `Edit User: ${user.user}`,
      html: `
        <input id="swal-edit-username" class="swal2-input" placeholder="Username" value="${user.user}" />
        <input id="swal-edit-password" class="swal2-input" type="password" placeholder="Password" value="${user.sambel}" />
      `,
      focusConfirm: false,
      preConfirm: () => {
        const updatedUser = (document.getElementById('swal-edit-username') as HTMLInputElement).value;
        const updatedPass = (document.getElementById('swal-edit-password') as HTMLInputElement).value;
        if (!updatedUser || !updatedPass) {
          Swal.showValidationMessage('Username dan password tidak boleh kosong');
        }
        return { user: updatedUser, pass: updatedPass };
      },
      showCancelButton: true,
      cancelButtonText: 'Batal',
      confirmButtonText: 'Simpan',
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
    });

    if (formValues) {
      showLoadingSwal('Menyimpan perubahan...');
      try {
        await axios.post('/api/admin/edit', {
          id: user.id,
          user: formValues.user,
          pass: formValues.pass,
        });
        await fetchUsers();
        Swal.fire('Berhasil', 'User berhasil diperbarui', 'success');
      } catch (error) {
        console.error(error);
        Swal.fire('Error', 'Gagal memperbarui user', 'error');
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
          <p className="text-3xl font-bold flex items-center gap-3">
            <FaUserShield className="text-blue-600" />
            Admin Panel
          </p>
          {/* <div className="flex gap-2">
            
            <button
              onClick={handleLogout}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md"
            >
              Logout
            </button>
          </div> */}
        </div>

        <div className="flex justify-between items-center mb-4">
          <input
            type="text"
            placeholder="Cari user..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            className="w-full md:w-1/3 px-4 py-2 border rounded-md dark:bg-gray-800 dark:border-gray-700"
          />
          <button
              onClick={handleCreateUser}
              className="flex items-center gap-2 bg-green-500 hover:bg-green-900 text-white px-4 py-2 rounded-md"
            >
              <FaPlus />
              Create User
            </button>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full bg-white dark:bg-gray-800 border rounded-md">
            <thead className="bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200">
              <tr>
                <th className="px-4 py-2 text-left">ID</th>
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
                    <td className="px-4 py-2">{user.id}</td>
                    <td className="px-4 py-2">{user.user}</td>
                    <td className="px-4 py-2">{user.sambel}</td>
                    <td className="px-4 py-2">
                      <div className="flex gap-2">
                        <button
                          onClick={() => EditUser(user)}
                          className="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-md text-sm"
                          title="Edit User"
                        >
                          <FaEdit />
                        </button>
                        {user.role !== 'admin' && (
                        <button
                          onClick={() => handleDelete(user.id)}
                          className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-md text-sm"
                          title="Delete User"
                        >
                          <FaTrash />
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