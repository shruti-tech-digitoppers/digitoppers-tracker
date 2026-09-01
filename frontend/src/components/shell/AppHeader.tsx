'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { Search } from 'lucide-react';
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
    if (pathname.startsWith('/dashboard')) return 'Dashboard';
    if (pathname.startsWith('/projects')) return 'Projects';
    if (pathname.startsWith('/tracker')) return 'Execution Tracker';
    return 'Project Tracker';
  };

  return (
    <header className="h-16 bg-white border-b border-[#b9c0cb]/40 sticky top-0 z-20 px-6 flex items-center justify-between gap-4 shadow-xs">
      {/* Left: Page Title Breadcrumb */}
      <div className="flex items-center gap-3">
        <h1 className="font-heading text-lg font-bold text-[#3a7d84] tracking-tight">
          {getPageTitle()}
        </h1>
      </div>

      {/* Right: Search, Date, Notifications, Profile */}
      <div className="flex items-center gap-4">
        {/* Search Input */}
        <div className="relative hidden sm:flex items-center">
          <Search className="w-3.5 h-3.5 text-[#b9c0cb] absolute left-3 pointer-events-none" />
          <input
            type="text"
            placeholder="Search projects or tasks..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-8 pr-3 py-1.5 text-xs bg-[#f8fafb] border border-[#b9c0cb]/50 rounded-xl w-48 lg:w-64 text-[#333333] placeholder-[#4a5462]/70 focus:outline-none focus:ring-1 focus:ring-[#51a8b1] focus:border-[#51a8b1] focus:bg-white transition-all"
          />
        </div>

        {/* Date Display */}
        <span className="hidden md:inline text-xs text-[#4a5462] font-medium">
          {formattedDate}
        </span>

        {/* Notification Bell */}
        <NotificationDropdown
          notifications={notifications}
          isOpen={isNotifOpen}
          onToggle={onToggleNotif}
          onMarkAsRead={onMarkAsRead}
          onMarkAllAsRead={onMarkAllAsRead}
          onSelectNotification={onSelectNotification}
        />

        {/* User Avatar */}
        {currentUser && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#2f4154] text-white flex items-center justify-center font-bold text-xs shadow-xs">
              {currentUser.name?.charAt(0) || 'U'}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
