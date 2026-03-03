/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import Swal from 'sweetalert2';
import { FaSyncAlt, FaUpload, FaCopy, FaTrash, FaSave, FaShieldAlt } from 'react-icons/fa';
import io from 'socket.io-client';
import { CgLogOut } from "react-icons/cg";
import { closeSwal, showLoadingSwal } from '@/components/base/Loading';

const Dashboard: React.FC = () => {
  const router = useRouter();
  const [accounts, setAccounts] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [userData, setUserData] = useState<{ id: number; user: string; role: string; canGet: boolean; canUpload: boolean; } | null>(null);
  
  const isLoadingRef = useRef(false);

  useEffect(() => {
    const checkUser = async () => {
      try {
        const res = await axios.get('/api/user/auth', { withCredentials: true });
        const user = res.data.user;

        if (user.role !== 'member') {
          router.push('/');
          return;
        }

        setUserData(user);
        fetchAccounts(user.user);
      } catch (error: unknown) {
        const err = error as Error;
        Swal.fire('Error', `${err.message || 'Gagal Logout'}`, 'error');
      }
    };

    checkUser();
  }, [router]);

  useEffect(() => {
    if (!userData?.user) return;

    const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL as string, {
      transports: ["websocket"],
    });

    const eventName = `send-cokis-${userData.user}`;

    socket.on(eventName, async (data) => {
      if (data?.fb && !isLoadingRef.current) {
        isLoadingRef.current = true;
        showLoadingSwal('Incoming Account...');
        try {
          await fetchAccounts(userData.user);
        } finally {
          setTimeout(() => {
            isLoadingRef.current = false;
            closeSwal();
          }, 1500);
        }
      }
    });

    return () => {
      socket.off(eventName);
      socket.disconnect();
    };
  }, [userData?.user]);

  const fetchAccounts = async (username?: string) => {
    const targetUser = username || userData?.user;
    if (!targetUser) return;

    try {
      setLoading(true);
      const res = await axios.get<{ fb: string }>('/api/user/akun', {
        params: { user: targetUser },
      });
      setAccounts(res.data.fb || '');
    } catch (err: any) {
      console.warn('Error loading:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!accounts) return;
    navigator.clipboard.writeText(accounts).then(() => {
      Swal.fire({
        position: "top-end",
        icon: "success",
        title: "Copied!",
        showConfirmButton: false,
        timer: 800,
        toast: true,
      });
    });
  };

  const handleLogout = async () => {
    try {
      await axios.post('/api/user/logout');
      router.push('/');
    } catch (error: unknown) {
      const err = error as Error;
      Swal.fire('Error', `${err.message || 'Gagal Logout'}`, 'error');
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-200 font-sans selection:bg-blue-500/30">
      
      {/* Glow Effect Background */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-full h-[300px] bg-blue-600/10 blur-[120px] pointer-events-none"></div>

      {/* Modern Navbar */}
      <nav className="sticky top-0 z-50 backdrop-blur-md bg-[#0f172a]/70 border-b border-slate-800">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 rounded-lg shadow-[0_0_15px_rgba(37,99,235,0.4)]">
              <FaShieldAlt className="text-white text-xl" />
            </div>
            <div>
              <h1 className="text-sm font-mono tracking-tight text-white uppercase">Server Akun</h1>
              <p className="text-[10px] text-slate-400 font-mono">Status: Connected as {userData?.user || '...'}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="hidden md:block text-right">
              <p className="text-xs text-slate-300 font-mono">Total Akun: {accounts ? accounts.split('\n').filter(Boolean).length : 0}</p>
              {/* <p className="text-sm font-bold text-blue-400">{accounts ? accounts.split('\n').filter(Boolean).length : 0}</p> */}
            </div>
            <button 
              onClick={handleLogout}
              className="p-2.5 rounded-full bg-slate-800 hover:bg-red-500/20 hover:text-red-400 transition-all duration-300 border border-slate-700"
            >
              <CgLogOut className="text-xl" />
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto py-10 px-6">
        
        {/* Main Interface */}
        <div className="grid grid-cols-1 gap-8">
          
          {/* Textarea Section */}
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
            <div className="relative bg-[#1e293b] rounded-2xl shadow-2xl border border-slate-700 overflow-hidden">
              <div className="flex items-center justify-between px-6 py-3 border-b border-slate-700 bg-slate-800/50">
                <span className="text-xs font-mono text-slate-400 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span> Raw Data Output
                </span>
                <span className="text-[10px] bg-slate-700 px-2 py-0.5 rounded text-slate-300">UTF-8</span>
              </div>
              <textarea
                className="w-full h-80 p-6 bg-transparent text-blue-50 font-mono text-sm focus:outline-none resize-none scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent"
                value={loading ? "Scanning database..." : accounts}
                placeholder="Waiting for incoming accounts..."
                readOnly
                spellCheck={false}
              />
            </div>
          </div>

          {/* Action Grid */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <ActionButton onClick={handleCopy} icon={<FaCopy />} label="Copy All" color="blue" />
            <ActionButton onClick={() => fetchAccounts()} icon={<FaSyncAlt />} label="Reload" color="slate" />
            <ActionButton onClick={() => router.push('/upload')} icon={<FaUpload />} label="Upload" color="slate" />
            <ActionButton onClick={() => {}} icon={<FaSave />} label="Export" color="slate" />
            <ActionButton onClick={() => {}} icon={<FaTrash />} label="Delete" color="red" />
          </div>

        </div>
      </main>

      <footer className="py-10 text-center">
        <p className="text-xs text-slate-500 font-mono">v3.0.0-stable | Developed with Prisma & Next.js</p>
      </footer>
    </div>
  );
};

// Reusable Button Component
const ActionButton = ({ onClick, icon, label, color }: any) => {
  const colors: any = {
    blue: "bg-blue-600 hover:bg-blue-500 shadow-blue-900/20",
    slate: "bg-slate-800 hover:bg-slate-700 border border-slate-700",
    red: "bg-red-600/10 hover:bg-red-600 text-red-500 hover:text-white border border-red-900/50",
  };

  return (
    <button
      onClick={onClick}
      className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium text-sm transition-all active:scale-95 shadow-lg ${colors[color]}`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
};

export default Dashboard;