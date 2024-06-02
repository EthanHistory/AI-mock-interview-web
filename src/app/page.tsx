'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Image from 'next/image';

export default function HomePage() {
  const router = useRouter();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-2">
      <div className="flex items-center mb-4">
        <Image src="/logo.jpeg" alt="Logo" width={120} height={120} className="mr-4 rounded-[10%]" />
        <h1 className="text-6xl font-bold">AI Mock Interview</h1>
      </div>
      <motion.a
        href="/interviewprepare"
        onClick={(e) => {
          e.preventDefault();
          router.push('/interviewprepare');
        }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className="px-4 py-2 bg-blue-500 text-white rounded cursor-pointer"
      >
        Start Interview
      </motion.a>
    </div>
  );
}
