'use client';

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import { useRouter } from 'next/navigation';
import { FaUpload, FaUser } from 'react-icons/fa6';
import { FaArrowCircleLeft } from 'react-icons/fa';

export default function UploadPage() {
    const router = useRouter();
    const [userData, setUserData] = useState<{ user: string; role: string; id: number; canUpload: boolean; } | null>(null);
    const [text, setText] = useState('');
    const [uploadCount, setUploadCount] = useState(0);
    const [isLoading, setIsLoading] = useState(false); // 👈 Tambahkan state loading

    useEffect(() => {
        //check permissions!
        const isAccept = async () => {
             
            try {
                const isPermit = await axios.get('/api/user/auth', { withCredentials: true });
                if (isPermit.data?.user.canUpload != 1) {
                    Swal.fire('Error', 'You dont have permissons!', 'error');
                    router.back();
                }
                
            } catch (error: any) {
                Swal.fire('Error', error?.error, 'error');
            }
        };
        
        isAccept(); 
    },[]);

    // Verifikasi user
    useEffect(() => {
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
            } catch (error: unknown) {
                if (axios.isAxiosError(error) && error.response && error.response.status === 401) {
                    console.log(error.message);
                    Swal.fire('Unauthorized', error.response.data.message, 'error');
                    router.push('/');
                }
            }
        };

        checkUser();
    }, []);

    const StartUpload = async () => {
        const cokisList = text.split('\n').map((item) => item.trim()).filter((item) => item !== '');
        setIsLoading(true); // 👉 Mulai loading

        try {
            let totalUploaded = 0;
            let cokis;

            for (cokis of cokisList) {
                const response = await axios.post('/api/user/upload_akun', {
                    cokis,
                    userId: userData?.user
                });
                if (response.data.success) {
                    totalUploaded++;
                }
            }

            if (totalUploaded === cokisList.length) {
                Swal.fire('Sukses', `Total akun: ${totalUploaded}`, 'success');
            } else {
                Swal.fire('Peringatan', `${totalUploaded} akun berhasil diupload, sisanya gagal.`, 'warning');
            }

            setText('');
            setUploadCount(totalUploaded);
        } catch (error) {
            if (axios.isAxiosError(error) && error.response && error.response.status === 401) {
                console.log(error.message);
                Swal.fire('Gagal', 'Terjadi kesalahan saat mengupload akun.', 'error');
            }
            
        } finally {
            setIsLoading(false); // 👉 Stop loading
        }
    };
    
    const HandleBack = () => {
        router.push('/dashboard');
    };

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-100">
        {/* Navbar */}
        <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm sticky top-0 z-50">
            <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2 text-lg font-semibold">
                <FaUser className="text-blue-600" />
                <span className="text-gray-800 dark:text-gray-100">
                Upload Akun Facebook Cokis {userData?.user}
                </span>
            </div>
            <button
                onClick={HandleBack}
                className="flex items-center gap-2 bg-blue-500 hover:bg-green-600 text-white px-4 py-2 rounded-md transition"
            >
                <FaArrowCircleLeft />
                Back to Dashboard
            </button>
            </div>
        </nav>

        {/* Main Content */}
        <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">
            {/* Textarea */}
            <div className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg shadow-md">
            <textarea
                className="w-full h-60 p-4 bg-gray-50 dark:bg-gray-900 text-sm font-mono rounded-lg resize-none focus:outline-none scrollbar-thin scrollbar-thumb-blue-500 scrollbar-track-gray-300 dark:scrollbar-track-gray-700"
                value={text}
                onChange={(e) => setText(e.target.value)}
                wrap="off"
                placeholder="Masukkan akun format email|pass|cookie"
            />
            </div>

            {/* Tombol Upload */}
            <div className="flex flex-wrap gap-4">
            {!isLoading ? (
                <button
                onClick={StartUpload}
                className="flex items-center gap-2 bg-green-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg shadow transition"
                >
                <FaUpload />
                Upload Akun
                </button>
            ) : (
                <div className="flex items-center gap-3 px-6 py-2 bg-green-600 text-white rounded-lg shadow">
                <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                <span>Mengupload akun...</span>
                </div>
            )}
            </div>

            {/* Upload Count */}
            {uploadCount > 0 && (
            <div className="mt-4 text-sm text-green-700 font-medium">
                ✅ {uploadCount} akun berhasil diupload.
            </div>
            )}
        </main>
        </div>
    );
}