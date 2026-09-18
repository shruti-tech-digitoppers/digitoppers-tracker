'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Search, LogIn, LayoutDashboard, X } from 'lucide-react';
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
}: AppHeaderProps) {
  const pathname = usePathname();
  const searchCtx = useSearch();

  // Use search context if available, otherwise fallback to props
  const query = propSearchQuery !== undefined ? propSearchQuery : searchCtx.searchQuery;
  const setQuery = propOnSearchChange || searchCtx.setSearchQuery;
  const clearQuery = searchCtx.clearSearch || (() => setQuery(''));

  const formattedDate = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date());

  const getPageTitle = () => {
    if (pathname.startsWith('/dashboard') || pathname === '/') return 'Executive Dashboard';
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
    <header className="mx-3 sm:mx-4 md:mx-6 mt-3 sm:mt-4 h-16 bg-white border border-slate-200 rounded-none sticky top-3 sm:top-4 z-20 px-4 sm:px-6 flex items-center justify-between gap-4 shadow-md shadow-slate-200/60 font-sans">
      {/* Left: Page Title / Logo Breadcrumb */}
      <div className="flex items-center gap-3">
        {!currentUser && (
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#3a7d84] to-[#51a8b1] flex items-center justify-center text-white shadow-xs">
            <LayoutDashboard className="w-4 h-4" />
          </div>
        )}
        <div>
          <h1 className="font-heading text-lg font-bold text-[#3a7d84] tracking-tight">
            {!currentUser ? 'DigiTopper Project Tracker' : getPageTitle()}
          </h1>
          {!currentUser && (
            <p className="text-[10.5px] text-[#556987] font-medium hidden sm:block">
              Public Live Overview
            </p>
          )}
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
        <span className="hidden lg:inline text-xs text-[#4a5462] font-medium whitespace-nowrap">
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
