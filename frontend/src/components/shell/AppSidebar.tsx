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
  ShieldCheck, 
  UserCheck, 
  History,
  X 
} from 'lucide-react';
import { IUser } from '../../types/auth';

interface AppSidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  currentUser: IUser | null;
  onLogout: () => void;
  unreadCount?: number;
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const AppSidebar = React.memo(function AppSidebar({
  collapsed,
  onToggleCollapse,
  currentUser,
  onLogout,
  unreadCount = 0,
  mobileOpen = false,
  onCloseMobile,
}: AppSidebarProps) {
  const pathname = usePathname();

  const isAdmin = 
    currentUser?.globalRole === 'ADMIN' || 
    (currentUser as any)?.role === 'ADMIN';

  const navItems = [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Projects', href: '/projects', icon: FolderKanban },
    { label: 'Tracker', href: '/tracker', icon: Compass },
    ...(currentUser ? [
      { label: 'Assign & Requests', href: '/requests', icon: UserCheck },
      { label: 'Activity Logs', href: '/activity', icon: History },
      ...(isAdmin ? [{ label: 'Employees', href: '/employees', icon: Users, badge: 'Admin' }] : []),
    ] : [
      { label: 'Login to Portal', href: '/login', icon: LogOut, badge: 'Sign in' }
    ]),
  ];

  return (
    <>
      {/* ── 1. Desktop Docked Sidebar (Hidden on responsive screens < 1024px) ── */}
      {currentUser && (
        <aside
          className={`
            desktop-docked-sidebar hidden lg:flex bg-white border-r border-[#b9c0cb]/40 flex-col justify-between z-30 transition-all duration-300 select-none
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
                <Link href="/dashboard" className="flex items-center gap-1.5 group min-w-0">
                  <img
                    src="/digitoppers-logo.png"
                    alt="Digitoppers"
                    className="h-11 w-auto object-contain max-w-[155px]"
                  />
                </Link>
              ) : (
                <Link
                  href="/dashboard"
                  className="w-12 h-12 rounded-2xl flex items-center justify-center hover:bg-teal-50/60 transition cursor-pointer"
                  title="Digitoppers Dashboard"
                >
                  <img
                    src="/digitoppers-icon.png"
                    alt="Digitoppers"
                    className="w-10 h-10 object-contain drop-shadow-xs"
                  />
                </Link>
              )}
            </div>

            {/* Navigation Links */}
            <nav className={`space-y-1 mt-2.5 ${collapsed ? 'px-2' : 'p-2.5'}`}>
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
                          : 'gap-3 px-3 py-2 text-xs font-medium'
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
                        ${collapsed ? 'w-5 h-5' : 'w-4 h-4'} 
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
          {currentUser && (
            <div className={`border-t border-[#f1f3f6] ${collapsed ? 'p-2' : 'p-2.5'}`}>
              <div className={collapsed ? 'flex flex-col items-center gap-1.5' : 'space-y-2'}>
                {!collapsed ? (
                  <div className="flex items-center justify-between p-2 rounded-xl bg-[#f8fafb] border border-[#b9c0cb]/30">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-7 h-7 rounded-lg bg-[#2f4154] text-white flex items-center justify-center font-bold text-xs flex-shrink-0 shadow-xs">
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
                      className="p-1 text-[#4a5462] hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                      title="Logout"
                    >
                      <LogOut className="w-3.5 h-3.5 stroke-[2]" />
                    </button>
                  </div>
                ) : (
                  <>
                    <div
                      className="w-9 h-9 rounded-xl bg-[#2f4154] text-white flex items-center justify-center font-bold text-xs shadow-xs"
                      title={currentUser.name}
                    >
                      {currentUser.name?.charAt(0) || 'U'}
                    </div>
                    <button
                      type="button"
                      onClick={onLogout}
                      className="w-9 h-9 flex items-center justify-center text-[#475569] hover:text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer"
                      title="Logout"
                    >
                      <LogOut className="w-4 h-4 stroke-[2]" />
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
        </aside>
      )}

      {/* ── 2. Responsive Mobile / Tablet Slide-Over Navigation Drawer ── */}
      <div
        className={`
          fixed inset-0 z-50 lg:hidden transition-all duration-300
          ${mobileOpen ? 'visible pointer-events-auto' : 'invisible pointer-events-none'}
        `}
      >
        {/* Backdrop Overlay */}
        <div
          onClick={onCloseMobile}
          className={`
            absolute inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity duration-300
            ${mobileOpen ? 'opacity-100' : 'opacity-0'}
          `}
        />

        {/* Sliding Panel */}
        <aside
          className={`
            relative w-[260px] max-w-[82vw] h-full bg-white shadow-2xl flex flex-col justify-between z-10 transition-transform duration-300 ease-out select-none
            ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
          `}
        >
          {/* Drawer Header with Logo & Close Button */}
          <div className="h-16 flex items-center justify-between px-4 border-b border-[#f1f3f6]">
            <Link href="/dashboard" onClick={onCloseMobile} className="flex items-center gap-1.5 group min-w-0">
              <img
                src="/digitoppers-logo.png"
                alt="Digitoppers"
                className="h-10 w-auto object-contain max-w-[150px]"
              />
            </Link>
            <button
              type="button"
              onClick={onCloseMobile}
              className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition cursor-pointer"
              title="Close Navigation Menu"
            >
              <X className="w-5 h-5 stroke-[2.2]" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1.5 p-3 flex-1 overflow-y-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onCloseMobile}
                  className={`
                    flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 text-xs font-medium
                    ${
                      isActive
                        ? 'bg-[#e8f6f8] text-[#2c6870] font-bold shadow-xs border border-[#9ed6dc]'
                        : 'text-[#475569] hover:bg-[#f0f8f9] hover:text-[#2c6870]'
                    }
                  `}
                >
                  <Icon className={`w-4.5 h-4.5 flex-shrink-0 ${isActive ? 'text-[#2c6870] stroke-[2.2]' : 'text-[#475569] stroke-[1.9]'}`} />
                  <span className="flex-1 truncate">{item.label}</span>
                  {item.badge && (
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-[#e6f4f6] text-[#3a7d84] border border-[#b6e0e4]/60">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* User Profile / Logout or Sign In */}
          <div className="border-t border-[#f1f3f6] p-3">
            {currentUser ? (
              <div className="flex items-center justify-between p-2 rounded-xl bg-[#f8fafb] border border-[#b9c0cb]/30">
                <div className="flex items-center gap-2 min-w-0">
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
                  onClick={() => {
                    if (onCloseMobile) onCloseMobile();
                    onLogout();
                  }}
                  className="p-1.5 text-[#4a5462] hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4 stroke-[2]" />
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                onClick={onCloseMobile}
                className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-gradient-to-r from-[#3a7d84] to-[#51a8b1] text-white text-xs font-bold shadow-xs cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign in to DigiToppers</span>
              </Link>
            )}
          </div>
        </aside>
      </div>
    </>
  );
});
