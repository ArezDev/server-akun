'use client';

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import { useRouter } from 'next/navigation';
import { FaShield, FaUpload } from 'react-icons/fa6';
import { FaArrowCircleLeft } from 'react-icons/fa';

export default function UploadPage() {
    const router = useRouter();
    const [userData, setUserData] = useState<{ user: string; role: string; id: number; canUpload: boolean; } | null>(null);
    const [text, setText] = useState('');
    const [uploadCount, setUploadCount] = useState(0);
    const [isLoading, setIsLoading] = useState(false);

    // --- 1. Verifikasi Permission & Auth ---
    useEffect(() => {
        const checkAuth = async () => {
            try {
                const res = await axios.get('/api/user/auth', { withCredentials: true });
                const user = res.data.user;

                // Cek Role & Ijin Upload
                if (user.role !== 'member' || user.canUpload !== 1) {
                    Swal.fire({
                        icon: 'error',
                        title: 'Akses Ditolak',
                        text: 'Sampeyan ora duwe ijin kanggo upload!',
                        background: '#1e293b',
                        color: '#f1f5f9'
                    });
                    router.push('/dashboard');
                    return;
                }
                setUserData(user);
            }  catch (error: unknown) {
                const err = error as Error;
                console.log(err.message);
                // Swal.fire('Error', `${err.message || 'Gagal Logout'}`, 'error');
                router.push('/');
            }
        };
        checkAuth();
    }, [router]);

    // --- 2. Logic Upload ---
    const StartUpload = async () => {
        if (!text.trim()) {
            return Swal.fire({ icon: 'warning', title: 'Kosong', text: 'Lebokno data akun dhisik!', timer: 1500, toast: true, showConfirmButton: false, position: 'top-end' });
        }

        const cokisList = text.split('\n').map((item) => item.trim()).filter((item) => item !== '');
        setIsLoading(true);
        let totalUploaded = 0;

        try {
            // Kita nganggo loop biasa ben gak ngebaki RAM yen datane ewonan
            for (const cokis of cokisList) {
                try {
                    const response = await axios.post('/api/user/upload_akun', {
                        cokis,
                        userId: userData?.user
                    });
                    if (response.data.success) {
                        totalUploaded++;
                    }
                } catch (err) {
                    console.error("Gagal upload siji baris:", err);
                }
            }

            if (totalUploaded === cokisList.length) {
                Swal.fire({
                    icon: 'success',
                    title: 'Berhasil!',
                    text: `Kabeh akun (${totalUploaded}) kasil diupload.`,
                    background: '#1e293b',
                    color: '#f1f5f9'
                });
            } else {
                Swal.fire({
                    icon: 'warning',
                    title: 'Rampung',
                    text: `${totalUploaded} kasil, ${cokisList.length - totalUploaded} gagal.`,
                    background: '#1e293b',
                    color: '#f1f5f9'
                });
            }

            setText('');
            setUploadCount(totalUploaded);
        } catch (error: unknown) {
            const err = error as Error;
            Swal.fire('Error', `${err.message || 'Gagal Logout'}`, 'error');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#0f172a] text-slate-200 font-sans">
            {/* Glow Effect */}
            <div className="fixed top-0 left-1/2 -translate-x-1/2 w-full h-[250px] bg-blue-600/10 blur-[100px] pointer-events-none"></div>

            {/* Navbar */}
            <nav className="sticky top-0 z-50 backdrop-blur-md bg-[#0f172a]/70 border-b border-slate-800">
                <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <FaShield className="text-blue-500 text-2xl" />
                        <h1 className="text-sm font-bold tracking-widest uppercase">Upload FB Cokis</h1>
                    </div>
                    <button
                        onClick={() => router.push('/dashboard')}
                        className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 px-4 py-2 rounded-xl border border-slate-700 transition-all active:scale-95 text-xs font-semibold"
                    >
                        <FaArrowCircleLeft />
                        Dashboard
                    </button>
                </div>
            </nav>

            {/* Main Content */}
            <main className="max-w-4xl mx-auto px-6 py-10 space-y-8">
                
                <div className="space-y-2">
                    <h2 className="text-2xl font-bold text-white">Mass Upload Akun</h2>
                    <p className="text-sm text-slate-400">Pastikan format bener: <code className="text-blue-400">email|pass|cookie</code></p>
                </div>

                {/* Textarea Container */}
                <div className="relative group">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl blur opacity-10 group-focus-within:opacity-30 transition"></div>
                    <div className="relative bg-[#1e293b] border border-slate-700 rounded-2xl overflow-hidden shadow-2xl">
                        <textarea
                            className="w-full h-80 p-6 bg-transparent text-blue-50 font-mono text-sm focus:outline-none resize-none scrollbar-thin scrollbar-thumb-slate-700"
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            wrap="off"
                            placeholder="user1|pass1|cookie1&#10;user2|pass2|cookie2"
                            spellCheck={false}
                        />
                        <div className="bg-slate-800/50 px-6 py-3 border-t border-slate-700 flex justify-between items-center">
                            <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Line Count: {text.split('\n').filter(Boolean).length}</span>
                            {userData && (
                                <span className="text-[10px] text-blue-400 font-mono">Operator: {userData.user}</span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Bottom Actions */}
                <div className="flex flex-col items-center gap-6">
                    {!isLoading ? (
                        <button
                            onClick={StartUpload}
                            className="group relative flex items-center gap-3 bg-blue-600 hover:bg-blue-500 text-white px-10 py-4 rounded-2xl font-bold shadow-[0_0_20px_rgba(37,99,235,0.3)] transition-all active:scale-95"
                        >
                            <FaUpload className="group-hover:-translate-y-1 transition-transform" />
                            Mulai Upload Akun
                        </button>
                    ) : (
                        <div className="flex flex-col items-center gap-4">
                            <div className="flex items-center gap-4 px-8 py-4 bg-slate-800 border border-slate-700 text-blue-400 rounded-2xl">
                                <div className="animate-spin h-5 w-5 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                                <span className="font-bold text-sm tracking-wide">Processing Database...</span>
                            </div>
                            <p className="text-[10px] text-slate-500 animate-pulse font-mono">Jangan tutup halaman ini sampai selesai.</p>
                        </div>
                    )}

                    {uploadCount > 0 && (
                        <div className="px-6 py-2 bg-green-500/10 border border-green-500/20 rounded-full">
                            <p className="text-xs text-green-400 font-bold">
                                SUCCESS: {uploadCount} Records Synchronized
                            </p>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}