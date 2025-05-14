'use client';  // Ensure the component is treated as a Client Component

import { useRouter } from 'next/navigation';  // Use the correct import from 'next/navigation'
import axios from 'axios';
import Swal from 'sweetalert2';

export default function Login() {
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

    try {

        // Tampilkan loading Login..
          Swal.fire({
            title: 'Sedang mencoba akses admin...',
            text: 'Tunggu sebentar',
            allowOutsideClick: false,
            didOpen: () => {
              Swal.showLoading();
            },
          });
      
      const response = await axios.post('/api/admin/login.admin', {
        user,
        pass,
      });

      if (response.data.user.role === 'admin') {
          Swal.close();
          Swal.fire({
            icon: 'success',
            title: 'Welcome Admin!',
            showConfirmButton: false,
            timer: 1000, // dalam milidetik (1500ms = 1.5 detik)
            timerProgressBar: true,
          });
          router.push('/admin'); // Redirect to dashboard if login is successful
          // setTimeout(() => {
            
          // }, 1000);
          
      } 
      // else {
      //   Swal.fire('Error', 'Invalid credentials', 'error');
      // }
    } catch (error: unknown) {

      if (axios.isAxiosError(error) && error.response && error.response.status === 401) {
        //Swal.fire('Error', 'An error occurred. Please try again.', 'error');
        Swal.fire('Error', error.message, 'error');
      }
      
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-800 text-black">
      <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold text-center mb-6">Login Admin</h2>
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
              placeholder="Enter your username"
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
              placeholder="Enter your password"
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
