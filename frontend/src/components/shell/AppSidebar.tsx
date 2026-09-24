'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  FolderKanban, 
  Compass, 
  Users,
  LogOut, 
  ChevronLeft, 
  ChevronRight, 
  LogIn,
  ShieldCheck,
  UserCheck,
  History
} from 'lucide-react';
import { IUser } from '../../types/auth';

interface AppSidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  currentUser: IUser | null;
  onLogout: () => void;
  unreadCount?: number;
}

export const AppSidebar = React.memo(function AppSidebar({
  collapsed,
  onToggleCollapse,
  currentUser,
  onLogout,
  unreadCount = 0,
}: AppSidebarProps) {
  const pathname = usePathname();

  const isAdmin = 
    currentUser?.globalRole === 'ADMIN' || 
    (currentUser as any)?.role === 'ADMIN';

  const navItems = [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Projects', href: '/projects', icon: FolderKanban },
    { label: 'Tracker', href: '/tracker', icon: Compass },
    { label: 'Assign & Requests', href: '/requests', icon: UserCheck },
    { label: 'Activity Logs', href: '/activity', icon: History },
    ...(isAdmin ? [{ label: 'Employees', href: '/employees', icon: Users, badge: 'Admin' }] : []),
  ];

  return (
    <aside
      className={`
        bg-white border-r border-[#b9c0cb]/40 flex flex-col justify-between z-30 transition-all duration-300 select-none
        sticky top-0 h-screen flex-shrink-0 shadow-xs
        ${collapsed ? 'w-[72px]' : 'w-[230px]'}
      `}
    >
      {/* Top: Brand Logo / Icon */}
      <div>
        <div
          className={`h-16 flex items-center border-b border-[#f1f3f6] ${
            collapsed ? 'justify-center px-1' : 'px-4 justify-start'
          }`}
        >
          {!collapsed ? (
            <Link href="/dashboard" className="relative flex items-center gap-1.5 group min-w-0">
              <img
                src="/digitoppers-logo.png"
                alt="Digitoppers"
                className="h-11 w-auto object-contain max-w-[155px]"
              />
              {unreadCount > 0 && (
                <span className="absolute -top-1.5 -right-2 bg-rose-500 text-white text-xs font-black min-w-[22px] h-[22px] px-1.5 flex items-center justify-center rounded-full shadow-md ring-2 ring-white animate-pulse">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </Link>
          ) : (
            <Link
              href="/dashboard"
              className="relative w-12 h-12 rounded-2xl flex items-center justify-center hover:bg-teal-50/60 transition cursor-pointer"
              title={`Digitoppers Dashboard ${unreadCount > 0 ? `(${unreadCount} Notifications)` : ''}`}
            >
              <img
                src="/digitoppers-icon.png"
                alt="Digitoppers"
                className="w-10 h-10 object-contain drop-shadow-xs"
              />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[11px] font-black w-6 h-6 flex items-center justify-center rounded-full shadow-md ring-2 ring-white animate-pulse">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Link>
          )}
        </div>

        {/* Navigation Links */}
        <nav className={`space-y-1.5 mt-2 ${collapsed ? 'px-2' : 'p-2.5'}`}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  flex items-center rounded-xl transition-all duration-200 group
                  ${
                    collapsed
                      ? 'w-11 h-11 mx-auto justify-center'
                      : 'gap-3 px-3 py-2.5 text-xs font-medium'
                  }
                  ${
                    isActive
                      ? 'bg-[#e8f6f8] text-[#2c6870] font-bold shadow-xs border border-[#9ed6dc]'
                      : 'text-[#475569] hover:bg-[#f0f8f9] hover:text-[#2c6870]'
                  }
                `}
                title={collapsed ? item.label : undefined}
              >
                <Icon
                  className={`
                    ${collapsed ? 'w-[22px] h-[22px]' : 'w-4.5 h-4.5'} 
                    flex-shrink-0 transition-colors
                    ${isActive ? 'text-[#2c6870] stroke-[2.2]' : 'text-[#475569] group-hover:text-[#2c6870] stroke-[1.9]'}
                  `}
                />
                {!collapsed && (
                  <div className="flex items-center justify-between flex-1 min-w-0">
                    <span className="truncate">{item.label}</span>
                    {item.badge && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-[#e6f4f6] text-[#3a7d84] border border-[#b6e0e4]/60">
                        {item.badge}
                      </span>
                    )}
                  </div>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom: User Profile / Auth Area */}
      <div className={`border-t border-[#f1f3f6] ${collapsed ? 'p-2' : 'p-3'}`}>
        {currentUser ? (
          <div className={collapsed ? 'flex flex-col items-center gap-1.5' : 'space-y-2'}>
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
                  <LogOut className="w-4 h-4 stroke-[2]" />
                </button>
              </div>
            ) : (
              <>
                <div
                  className="w-10 h-10 rounded-xl bg-[#2f4154] text-white flex items-center justify-center font-bold text-sm shadow-xs"
                  title={currentUser.name}
                >
                  {currentUser.name?.charAt(0) || 'U'}
                </div>
                <button
                  type="button"
                  onClick={onLogout}
                  className="w-10 h-10 flex items-center justify-center text-[#475569] hover:text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer"
                  title="Logout"
                >
                  <LogOut className="w-5 h-5 stroke-[2]" />
                </button>
              </>
            )}
          </div>
        ) : (
          <Link
            href="/login"
            className={`
              w-full flex items-center gap-2 rounded-xl text-xs font-semibold bg-[#51a8b1] text-white hover:bg-[#3a7d84] transition shadow-xs
              ${collapsed ? 'h-10 justify-center p-0' : 'px-3 py-2.5 justify-center'}
            `}
            title="Sign In"
          >
            <LogIn className="w-5 h-5 stroke-[2]" />
            {!collapsed && <span>Sign In</span>}
          </Link>
        )}
      </div>
    </aside>
  );
});
