'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Search, LogIn, LayoutDashboard } from 'lucide-react';
import { IUser } from '../../types/auth';
import { INotificationItem } from '../../lib/api/notifications.api';
import { NotificationDropdown } from './NotificationDropdown';

interface AppHeaderProps {
  currentUser: IUser | null;
  notifications: INotificationItem[];
  isNotifOpen: boolean;
  onToggleNotif: () => void;
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onSelectNotification?: (item: INotificationItem) => void;
  searchQuery: string;
  onSearchChange: (val: string) => void;
}

export function AppHeader({
  currentUser,
  notifications,
  isNotifOpen,
  onToggleNotif,
  onMarkAsRead,
  onMarkAllAsRead,
  onSelectNotification,
  searchQuery,
  onSearchChange,
}: AppHeaderProps) {
  const pathname = usePathname();

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
    return 'Project Tracker';
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
        {/* Search Input */}
        <div className="relative hidden sm:flex items-center">
          <Search className="w-3.5 h-3.5 text-[#b9c0cb] absolute left-3 pointer-events-none" />
          <input
            type="text"
            placeholder="Search projects..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-8 pr-3 py-1.5 text-xs bg-[#f8fafb] border border-[#b9c0cb]/50 rounded-xl w-44 lg:w-60 text-[#333333] placeholder-[#4a5462]/70 focus:outline-none focus:ring-1 focus:ring-[#51a8b1] focus:border-[#51a8b1] focus:bg-white transition-all"
          />
        </div>

        {/* Date Display */}
        <span className="hidden md:inline text-xs text-[#4a5462] font-medium">
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
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#51a8b1] text-white text-xs font-bold hover:bg-[#3a7d84] shadow-xs transition active:scale-95 cursor-pointer"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Log In</span>
          </Link>
        )}
      </div>
    </header>
  );
}
