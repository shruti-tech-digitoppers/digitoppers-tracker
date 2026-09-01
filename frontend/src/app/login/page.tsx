'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { authApi } from '../../lib/api/auth.api';
import { LoginForm } from '../../features/auth/LoginForm';
import { QuickDemoAccounts } from '../../features/auth/QuickDemoAccounts';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      const res = await authApi.login({ email, password });
      
      if (res.token) {
        localStorage.setItem('token', res.token);
        localStorage.setItem('accessToken', res.token);
        localStorage.setItem('digitopper_token', res.token);
        localStorage.setItem('user', JSON.stringify(res.user));
        window.location.href = '/dashboard';
      } else {
        setError('Login failed: Token not received from server.');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (quickEmail: string, quickPass: string) => {
    setEmail(quickEmail);
    setPassword(quickPass);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#2f4154] px-4 py-8 relative overflow-hidden font-sans">
      {/* Subtle Background Glow Elements */}
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-[#51a8b1]/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-[#a8cf45]/15 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-md w-full border border-[#51a8b1]/30 rounded-3xl p-8 bg-[#1e2c3a]/90 backdrop-blur-xl shadow-2xl space-y-6 text-white relative z-10">
        {/* Brand Header */}
        <div className="text-center space-y-1.5">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#3a7d84] to-[#51a8b1] font-heading font-black text-2xl text-white shadow-lg shadow-[#51a8b1]/30 mb-2 border border-white/20">
            D
          </div>
          <h1 className="font-heading text-2xl font-extrabold tracking-tight text-white">
            DIGI<span className="text-[#a8cf45]">TOPPERS</span>
          </h1>
          <p className="text-xs text-[#d1d8df]">Enterprise Project Execution & Control Center</p>
        </div>

        {error && (
          <div className="bg-rose-500/15 border border-rose-500/30 text-rose-300 p-3 rounded-xl text-xs font-medium animate-in fade-in duration-150">
            {error}
          </div>
        )}

        <LoginForm
          email={email}
          setEmail={setEmail}
          password={password}
          setPassword={setPassword}
          loading={loading}
          onSubmit={handleLogin}
        />

        {/* Quick Demo Accounts */}
        <QuickDemoAccounts onSelectAccount={handleQuickLogin} />
      </div>
    </div>
  );
}