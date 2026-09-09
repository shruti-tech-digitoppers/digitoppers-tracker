'use client';

import React from 'react';

interface LoginFormProps {
  email: string;
  setEmail: (val: string) => void;
  password: string;
  setPassword: (val: string) => void;
  loading: boolean;
  onSubmit: (e: React.FormEvent) => void;
}

export function LoginForm({
  email,
  setEmail,
  password,
  setPassword,
  loading,
  onSubmit,
}: LoginFormProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label className="block text-xs font-semibold text-[#d1d8df] mb-1">Email Address</label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="admin@digitopper.com"
          className="w-full border border-white/10 rounded-xl px-3.5 py-2.5 text-sm bg-white/5 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#51a8b1] focus:border-[#51a8b1] transition-all"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-[#d1d8df] mb-1">Password</label>
        <input
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          className="w-full border border-white/10 rounded-xl px-3.5 py-2.5 text-sm bg-white/5 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#51a8b1] focus:border-[#51a8b1] transition-all"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full font-heading bg-[#51a8b1] text-white py-3 rounded-xl text-sm font-bold hover:bg-[#3a7d84] active:scale-[0.99] disabled:opacity-50 transition-all shadow-lg shadow-[#51a8b1]/25 cursor-pointer"
      >
        {loading ? 'Authenticating...' : 'Sign In'}
      </button>
    </form>
  );
}
