'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Search, LogIn, LogOut, LayoutDashboard, X, Menu } from 'lucide-react';
import { IUser } from '../../types/auth';
import { INotificationItem } from '../../lib/api/notifications.api';
import { NotificationDropdown } from './NotificationDropdown';
import { useSearch } from '../../context/SearchContext';

interface AppHeaderProps {
  currentUser: IUser | null;
  notifications: INotificationItem[];
  isNotifOpen: boolean;
  onToggleNotif: () => void;
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onSelectNotification?: (item: INotificationItem) => void;
  searchQuery?: string;
  onSearchChange?: (val: string) => void;
  collapsed?: boolean;
  onToggleSidebar?: () => void;
}

export function AppHeader({
  currentUser,
  notifications,
  isNotifOpen,
  onToggleNotif,
  onMarkAsRead,
  onMarkAllAsRead,
  onSelectNotification,
  searchQuery: propSearchQuery,
  onSearchChange: propOnSearchChange,
  collapsed,
  onToggleSidebar,
}: AppHeaderProps) {
  const pathname = usePathname();
  const searchCtx = useSearch();

  // Use search context if available, otherwise fallback to props
  const query = propSearchQuery !== undefined ? propSearchQuery : searchCtx.searchQuery;
  const setQuery = propOnSearchChange || searchCtx.setSearchQuery;
  const clearQuery = searchCtx.clearSearch || (() => setQuery(''));

  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => {
    setMounted(true);
  }, []);

  const formattedDate = mounted
    ? new Intl.DateTimeFormat('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }).format(new Date())
    : '';

  const getPageTitle = () => {
    if (pathname.startsWith('/dashboard') || pathname === '/') return 'Dashboard';
    if (pathname.startsWith('/projects')) return 'Projects';
    if (pathname.startsWith('/tracker')) return 'Execution Tracker';
    if (pathname.startsWith('/employees')) return 'Employees';
    if (pathname.startsWith('/requests')) return 'Project Requests';
    return 'Project Tracker';
  };

  const getSearchPlaceholder = () => {
    if (pathname.startsWith('/employees')) return 'Search employees, role, code...';
    if (pathname.startsWith('/requests')) return 'Search requests, ID, client...';
    return 'Search projects, ID, PM...';
  };

  return (
    <header className="w-full h-16 bg-white border-b border-slate-200/90 sticky top-0 z-20 px-4 sm:px-6 flex items-center justify-between gap-4 shadow-2xs font-sans">
      {/* Left: 3-line Menu Hamburger Toggle & Page Title */}
      <div className="flex items-center gap-3">
        {onToggleSidebar && (
          <button
            type="button"
            onClick={onToggleSidebar}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-600 hover:text-[#2d6b73] hover:bg-[#f0f8f9] border border-slate-200 hover:border-[#b6e0e4] transition-all cursor-pointer shadow-2xs active:scale-95 shrink-0"
            title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            <Menu className="w-5 h-5 stroke-[2.2]" />
          </button>
        )}

        {!currentUser && !onToggleSidebar && (
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#3a7d84] to-[#51a8b1] flex items-center justify-center text-white shadow-xs">
            <LayoutDashboard className="w-4 h-4" />
          </div>
        )}

        <div>
          <h1 className="font-heading text-xl sm:text-2xl font-bold text-[#2d6b73] tracking-tight">
            {!currentUser ? 'DigiToppers Project Tracker' : getPageTitle()}
          </h1>
        </div>
      </div>

      {/* Right: Search, Date, Notifications, Profile / Login */}
      <div className="flex items-center gap-3 sm:gap-4">
        {/* Interactive Global Search Input */}
        <div className="relative flex items-center">
          <Search className="w-3.5 h-3.5 text-[#51a8b1] absolute left-3 pointer-events-none" />
          <input
            type="text"
            placeholder={getSearchPlaceholder()}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-8 pr-8 py-1.5 text-xs bg-[#f8fafb] border border-[#b9c0cb]/60 rounded-xl w-36 sm:w-52 md:w-64 lg:w-72 text-[#1e293b] placeholder-[#556987]/70 focus:outline-none focus:ring-2 focus:ring-[#51a8b1]/30 focus:border-[#51a8b1] focus:bg-white transition-all shadow-2xs font-medium"
          />
          {query && (
            <button
              type="button"
              onClick={clearQuery}
              className="absolute right-2.5 p-0.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition cursor-pointer"
              title="Clear search"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Date Display */}
        <span suppressHydrationWarning className="hidden lg:inline text-xs text-[#4a5462] font-medium whitespace-nowrap">
          {formattedDate}
        </span>

        {/* Notification Bell (Only for logged-in users) */}
        {currentUser && (
          <NotificationDropdown
            notifications={notifications}
            isOpen={isNotifOpen}
            onToggle={onToggleNotif}
            onMarkAsRead={onMarkAsRead}
            onMarkAllAsRead={onMarkAllAsRead}
            onSelectNotification={onSelectNotification}
          />
        )}

        {/* User Profile & Logout (When logged in) */}
        {currentUser && (
          <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#3a7d84] to-[#51a8b1] text-white flex items-center justify-center font-bold text-xs shadow-xs">
                {currentUser.name?.charAt(0) || 'U'}
              </div>
              <div className="hidden sm:block text-left min-w-0 max-w-[120px]">
                <p className="text-xs font-bold text-[#111827] truncate leading-tight">{currentUser.name}</p>
                <p className="text-[10px] text-[#556987] font-semibold truncate leading-tight capitalize">{(currentUser as any).globalRole || 'Employee'}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                if (typeof window !== 'undefined') {
                  localStorage.removeItem('token');
                  localStorage.removeItem('accessToken');
                  localStorage.removeItem('digitopper_token');
                  localStorage.removeItem('user');
                  window.location.href = '/';
                }
              }}
              className="p-1.5 rounded-xl hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition cursor-pointer"
              title="Log Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Login Button for unauthenticated view */}
        {!currentUser && (
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#51a8b1] text-white text-xs font-bold hover:bg-[#3a7d84] shadow-xs transition active:scale-95 cursor-pointer shrink-0"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Log In</span>
          </Link>
        )}
      </div>
    </header>
  );
}
