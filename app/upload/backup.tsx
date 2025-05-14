'use client';

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import Navigasi from '@/components/Header';
import { useRouter } from 'next/navigation';
import { FaUpload } from 'react-icons/fa6';

export default function UploadPage() {

    // Fungsi statis
    const router = useRouter();
    const [userData, setUserData] = useState<{ user: string; role: string; id: number } | null>(null);
    const [text, setText] = useState('');
    const [uploadCount, setUploadCount] = useState(0); // Menyimpan jumlah baris yang berhasil diupload

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

    const StartUpload = async () => {
        const cokisList = text.split('\n').map((item) => item.trim()).filter((item) => item !== ''); // Memisahkan cokis berdasarkan baris

        try {
            let totalUploaded = 0;
            
            // Kirim setiap cokis satu per satu
            for (let cokis of cokisList) {
                const response = await axios.post('/api/user/upload_akun', { cokis, userId: userData?.id });
                if (response.data.success) {
                    totalUploaded++;
                }
            }

            // Tampilkan hasil
            if (totalUploaded === cokisList.length) {
                Swal.fire('Sukses', `Semua akun diupload ke server! Total akun: ${totalUploaded}`, 'success');
            } else {
                Swal.fire('Peringatan', `${totalUploaded} akun berhasil diupload, sisanya gagal.`, 'warning');
            }

            setText('');
            setUploadCount(totalUploaded); // Update jumlah baris yang berhasil diupload

        } catch (error) {
            Swal.fire('Gagal', 'Terjadi kesalahan saat mengupload akun.', 'error');
        }
    };

    return (
        <>
            <Navigasi data={userData?.user} />

            <textarea
                className="w-full h-60 p-4 border border-gray-300 rounded-md dark:bg-gray-800 dark:border-gray-700 resize-none"
                value={text}
                onChange={(e) => setText(e.target.value)}
                wrap="off"
            />

            <div className="flex flex-wrap gap-4 mt-4">
                <button
                    onClick={StartUpload}
                    className="flex items-center gap-2 bg-green-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md"
                >
                    <FaUpload />
                    Upload Akun
                </button>
            </div>

            {/* Tampilkan jumlah baris yang berhasil diupload */}
            {uploadCount > 0 && (
                <div className="mt-7 text-green-700">
                    <p>{uploadCount} akun berhasil diupload.</p>
                </div>
            )}
        </>
    );
}