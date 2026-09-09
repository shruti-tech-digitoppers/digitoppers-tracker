'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import LoginPage from './login/page';

export default function Home() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
      if (token) {
        router.replace('/dashboard');
      } else {
        setChecking(false);
      }
    }
  }, [router]);

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#2f4154] text-white">
        <div className="w-8 h-8 border-3 border-[#51a8b1] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return <LoginPage />;
}
