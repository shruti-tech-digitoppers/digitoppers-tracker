'use client';

import React from 'react';

interface QuickDemoAccountsProps {
  onSelectAccount: (email: string, pass: string) => void;
}

export function QuickDemoAccounts({ onSelectAccount }: QuickDemoAccountsProps) {
  return (
    <div className="border-t border-white/10 pt-4 space-y-2">
      <p className="text-[10px] font-semibold text-[#d1d8df] uppercase tracking-wider text-center font-heading">
        Quick Demo Accounts (Click to Fill)
      </p>
      <div className="grid grid-cols-2 gap-2 text-xs">
        <button
          type="button"
          onClick={() => onSelectAccount('admin@digitopper.com', 'Admin@123')}
          className="p-2.5 text-left rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-[#51a8b1]/50 transition cursor-pointer"
        >
          <div className="font-heading font-bold text-[#51a8b1]">👑 Admin</div>
          <div className="text-[10px] text-[#d1d8df] truncate">admin@digitopper.com</div>
        </button>
        <button
          type="button"
          onClick={() => onSelectAccount('rahul.pm@digitopper.com', 'Password@123')}
          className="p-2.5 text-left rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-[#a8cf45]/50 transition cursor-pointer"
        >
          <div className="font-heading font-bold text-[#a8cf45]">📊 Project Mgr</div>
          <div className="text-[10px] text-[#d1d8df] truncate">rahul.pm@...</div>
        </button>
        <button
          type="button"
          onClick={() => onSelectAccount('amit.contrib@digitopper.com', 'Password@123')}
          className="p-2.5 text-left rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-[#51a8b1]/50 transition cursor-pointer"
        >
          <div className="font-heading font-bold text-[#84ccd3]">⚡ Contributor</div>
          <div className="text-[10px] text-[#d1d8df] truncate">amit.contrib@...</div>
        </button>
        <button
          type="button"
          onClick={() => onSelectAccount('priya.viewer@digitopper.com', 'Password@123')}
          className="p-2.5 text-left rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-[#a8cf45]/50 transition cursor-pointer"
        >
          <div className="font-heading font-bold text-[#cbe475]">👁️ Viewer</div>
          <div className="text-[10px] text-[#d1d8df] truncate">priya.viewer@...</div>
        </button>
      </div>
    </div>
  );
}
