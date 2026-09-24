'use client';

import React from 'react';
import { Crown, Code2, Briefcase, Sparkles, ArrowRight } from 'lucide-react';

interface QuickDemoAccountsProps {
  onSelectAccount: (email: string, pass: string, autoSubmit?: boolean) => void;
  disabled?: boolean;
}

const DEMO_USERS = [
  {
    name: 'Pawan Sir',
    fullName: 'Pawan Kumar',
    role: 'CEO / Super Admin',
    designation: 'CEO',
    email: 'growth@digitoppers.com',
    password: 'Digitoppers@123',
    code: 'EMP001',
    badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    borderColor: 'hover:border-amber-400/60',
    iconBg: 'bg-gradient-to-tr from-amber-600 to-amber-400 text-white',
    icon: Crown,
  },
  {
    name: 'Sandeep Sir',
    fullName: 'Sandeep Mudgal',
    role: 'CTO / Tech Lead',
    designation: 'CTO',
    email: 'tech@digitoppers.com',
    password: 'Digitoppers@123',
    code: 'EMP003',
    badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
    borderColor: 'hover:border-cyan-400/60',
    iconBg: 'bg-gradient-to-tr from-cyan-600 to-teal-400 text-white',
    icon: Code2,
  },
  {
    name: 'Soumay',
    fullName: 'Soumay Garg',
    role: 'Project Manager',
    designation: 'Associate PM',
    email: 'soumay@digitoppers.com',
    password: 'Digitoppers@123',
    code: 'EMP005',
    badgeColor: 'bg-lime-500/20 text-lime-300 border-lime-500/30',
    borderColor: 'hover:border-lime-400/60',
    iconBg: 'bg-gradient-to-tr from-emerald-600 to-lime-400 text-white',
    icon: Briefcase,
  },
  {
    name: 'Shruti',
    fullName: 'Shruti',
    role: 'Technical Intern',
    designation: 'Tech Intern',
    email: 'shruti@digitoppers.com',
    password: 'Digitoppers@123',
    code: 'EMP013',
    badgeColor: 'bg-sky-500/20 text-sky-300 border-sky-500/30',
    borderColor: 'hover:border-sky-400/60',
    iconBg: 'bg-gradient-to-tr from-indigo-600 to-sky-400 text-white',
    icon: Sparkles,
  },
];

export function QuickDemoAccounts({ onSelectAccount, disabled = false }: QuickDemoAccountsProps) {
  return (
    <div className="border-t border-white/10 pt-4 space-y-2.5">
      <div className="flex items-center justify-between px-1">
        <p className="text-[10.5px] font-bold text-[#d1d8df] uppercase tracking-wider font-heading">
          ⚡ 1-Click Quick Demo Logins
        </p>
        <span className="text-[10px] text-[#51a8b1] font-mono">Click to Instant Login</span>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs">
        {DEMO_USERS.map((user) => {
          const Icon = user.icon;
          return (
            <button
              key={user.email}
              type="button"
              disabled={disabled}
              onClick={() => onSelectAccount(user.email, user.password, true)}
              className={`p-2.5 text-left rounded-2xl bg-white/[0.04] hover:bg-white/[0.09] border border-white/10 ${user.borderColor} transition-all duration-200 cursor-pointer group shadow-sm hover:shadow-md hover:-translate-y-0.5 disabled:opacity-50 disabled:pointer-events-none`}
            >
              <div className="flex items-center justify-between gap-1 mb-1.5">
                <div className="flex items-center gap-1.5">
                  <div className={`w-6 h-6 rounded-lg flex items-center justify-center shadow-xs ${user.iconBg}`}>
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <span className="font-heading font-extrabold text-white text-xs group-hover:text-[#a8cf45] transition-colors">
                    {user.name}
                  </span>
                </div>
                <ArrowRight className="w-3 h-3 text-slate-400 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
              </div>

              <div className="flex items-center justify-between gap-1">
                <span className={`inline-flex items-center text-[9.5px] font-bold px-1.5 py-0.5 rounded border ${user.badgeColor}`}>
                  {user.designation}
                </span>
                <span className="text-[9.5px] font-mono text-slate-400">
                  {user.code}
                </span>
              </div>

              <div className="text-[10px] text-slate-400/90 truncate mt-1 font-mono">
                {user.email}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
