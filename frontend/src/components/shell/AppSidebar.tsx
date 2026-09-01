'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  FolderKanban, 
  Compass, 
  LogOut, 
  ChevronLeft, 
  ChevronRight, 
  LogIn
} from 'lucide-react';
import { IUser } from '../../types/auth';

interface AppSidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  currentUser: IUser | null;
  onLogout: () => void;
}

export function AppSidebar({
  collapsed,
  onToggleCollapse,
  currentUser,
  onLogout,
}: AppSidebarProps) {
  const pathname = usePathname();

  const navItems = [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Projects', href: '/projects', icon: FolderKanban },
    { label: 'Tracker', href: '/tracker', icon: Compass },
  ];

  return (
    <aside
      className={`
        bg-white border-r border-[#b9c0cb]/40 flex flex-col justify-between z-30 transition-all duration-300 select-none
        sticky top-0 h-screen flex-shrink-0 shadow-xs
        ${collapsed ? 'w-20' : 'w-64'}
      `}
    >
      {/* Top: Brand & Collapse Toggle */}
      <div>
        <div className="h-16 px-4 flex items-center justify-between border-b border-[#f1f3f6]">
          {!collapsed ? (
            <Link href="/dashboard" className="flex items-center gap-1.5 group">
              <span className="font-heading font-black text-xl tracking-tight text-[#3a7d84] transition-colors">
                DIGI<span className="text-[#a8cf45]">TOPPERS</span>
              </span>
            </Link>
          ) : (
            <Link href="/dashboard" className="w-full flex justify-center">
              <span className="font-heading font-black text-lg tracking-tight text-[#51a8b1]">DT</span>
            </Link>
          )}

          <button
            type="button"
            onClick={onToggleCollapse}
            className="p-1.5 rounded-lg text-[#4a5462] hover:text-[#3a7d84] hover:bg-[#f0f8f9] transition cursor-pointer"
            title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="p-3 space-y-1.5 mt-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all duration-200
                  ${collapsed ? 'justify-center px-2' : ''}
                  ${
                    isActive
                      ? 'bg-[#f0f8f9] text-[#3a7d84] font-bold shadow-xs border border-[#b6e0e4]/80'
                      : 'text-[#4a5462] hover:bg-[#f0f8f9]/60 hover:text-[#3a7d84]'
                  }
                `}
                title={collapsed ? item.label : undefined}
              >
                <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-[#51a8b1]' : 'text-[#4a5462]'}`} />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom: User Profile / Auth Area */}
      <div className="p-3 border-t border-[#f1f3f6]">
        {currentUser ? (
          <div className="space-y-2">
            {!collapsed ? (
              <div className="flex items-center justify-between p-2 rounded-xl bg-[#f8fafb] border border-[#b9c0cb]/30">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-[#2f4154] text-white flex items-center justify-center font-bold text-xs flex-shrink-0 shadow-xs">
                    {currentUser.name?.charAt(0) || 'U'}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-[#333333] truncate leading-tight">{currentUser.name}</p>
                    <p className="text-[10px] text-[#4a5462] truncate leading-tight">{(currentUser as any).globalRole || 'Employee'}</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={onLogout}
                  className="p-1.5 text-[#4a5462] hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                  title="Logout"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={onLogout}
                className="w-full flex items-center justify-center p-2 text-[#4a5462] hover:text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        ) : (
          <Link
            href="/login"
            className={`
              w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold bg-[#51a8b1] text-white hover:bg-[#3a7d84] transition shadow-xs
              ${collapsed ? 'justify-center px-2' : 'justify-center'}
            `}
          >
            <LogIn className="w-4 h-4" />
            {!collapsed && <span>Sign In</span>}
          </Link>
        )}
      </div>
    </aside>
  );
}
