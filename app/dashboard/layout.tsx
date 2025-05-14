import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dashboard - Akun Server',
  description: 'A powerful server akun!',
};

// ✅ Tambahkan default export sebagai layout
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <section>
      {/* Misalnya tambahkan Navigasi khusus Dashboard di sini */}
      <main>{children}</main>
    </section>
  );
}
