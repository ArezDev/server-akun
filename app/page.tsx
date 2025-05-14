// app/page.tsx
import UserLogin from '@/components/style/FormLoginUser';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export default async function Home() {
  // Coba ambil cookie (misalnya token autentikasi)
  const cookieStore = await cookies();
  const token = cookieStore.get('sessionid'); // Atau nama cookie autentikasi kamu

  if (token) {
    // Jika token ada, redirect ke dashboard
    redirect('/dashboard');
  }

  return <UserLogin />;
}
