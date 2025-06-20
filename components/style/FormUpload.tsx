import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import { FaUser, FaUpload, FaCopy, FaTrash, FaSyncAlt, FaArrowCircleLeft } from 'react-icons/fa';

interface CardListProps {
  data?: string;
}

const NavigasiUpload: React.FC<CardListProps> = ({ data }) => {
    const router = useRouter();
    const HandleUpload = () => {
        router.push('/dashboard');
    };

    return (
    <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
        <FaUser className='text-blue-600' />Upload Akun Facebook Cokis {data}
        </h1>
        <button
            onClick={HandleUpload}
            className="flex items-center gap-2 bg-blue-500 hover:bg-green-600 text-white px-4 py-2 rounded-md"
            >
            <FaArrowCircleLeft />
            Back to Dashboard
        </button>
    </div>
    );
};

export default NavigasiUpload;