'use client';  // Ensure the component is treated as a Client Component

import { useRouter } from 'next/navigation';  // Use the correct import from 'next/navigation'
import axios from 'axios';
import Swal from 'sweetalert2';

export default function UserLogin() {
  const router = useRouter();
  
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    const form = e.target as HTMLFormElement;
    const user = (form.username as HTMLInputElement).value;
    const pass = (form.password as HTMLInputElement).value;

    if (!user || !pass) {
      Swal.fire('Error', 'Username and password are required', 'error');
      return;
    }

// Tampilkan loading Login..
    Swal.fire({
        title: 'Sedang masuk...',
        text: 'Tunggu sebentar',
        allowOutsideClick: false,
        didOpen: () => {
            Swal.showLoading();
        },
    });

    try {
      const response = await axios.post('/api/user/login', {
        user,
        pass,
      });
      
      if (response.data.success) {
        Swal.fire({
          icon: 'success',
          title: `Selamat Datang ${user}`,
          showConfirmButton: false,
          timer: 1500, // dalam milidetik (1500ms = 1.5 detik)
          timerProgressBar: true,
        });
        router.push('/dashboard'); // Redirect to dashboard if login is successful
      } else {
        Swal.fire('Error', response.data.message, 'error');
      }
    } catch (error: any) {
      Swal.fire('Error', 'An error occurred. Please try again.', 'error');
      if (error.response && error.response.status === 401) {
        Swal.fire('Login Gagal', error.response.data.message || 'Unauthorized', 'error');
      } else {
        Swal.fire('Error', 'An error occurred. Please try again.', 'error');
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-light-100 text-black dark:bg-gray-900">
      <div className="max-w-md w-full bg-grey dark:bg-gray-100 p-8 rounded-lg shadow-lg">
        <form onSubmit={handleLogin}>
          <div className="mb-4">
            <label htmlFor="username" className="block text-sm font-medium text-gray-700">
              Username
            </label>
            <input
              type="text"
              id="username"
              name="username"
              className="mt-1 p-2 w-full border border-gray-300 rounded-md"
              placeholder="User?"
              required
            />
          </div>
          <div className="mb-6">
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              type="password"
              id="password"
              name="password"
              className="mt-1 p-2 w-full border border-gray-300 rounded-md"
              placeholder="Password?"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700"
          >
            Login
          </button>
        </form>
      </div>
    </div>
  );
}