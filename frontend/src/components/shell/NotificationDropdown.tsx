'use client';

import React from 'react';
import { INotificationItem } from '../../lib/api/notifications.api';
import { Bell, CheckCheck, Sparkles, Inbox, ArrowRight } from 'lucide-react';

interface NotificationDropdownProps {
  notifications: INotificationItem[];
  isOpen: boolean;
  onToggle: () => void;
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onSelectNotification?: (item: INotificationItem) => void;
}

export function NotificationDropdown({
  notifications = [],
  isOpen,
  onToggle,
  onMarkAsRead,
  onMarkAllAsRead,
  onSelectNotification,
}: NotificationDropdownProps) {
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const formatRelativeTime = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays === 1) return 'Yesterday';
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch {
      return '';
    }
  };

  const handleItemClick = (item: INotificationItem) => {
    if (!item.isRead) {
      onMarkAsRead(item._id);
    }
    if (onSelectNotification) {
      onSelectNotification(item);
    }
  };

  return (
    <div className="relative font-sans">
      {/* Notification Bell Button */}
      <button
        type="button"
        onClick={onToggle}
        className={`relative p-2.5 rounded-2xl transition-all cursor-pointer select-none border ${
          isOpen 
            ? 'bg-[#f0f8f9] text-[#3a7d84] border-[#b6e0e4] shadow-xs' 
            : 'bg-white text-[#4a5462] border-[#b9c0cb]/40 hover:text-[#3a7d84] hover:bg-[#f8fafb]'
        }`}
        aria-label="Notifications"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[9.5px] font-black min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center shadow-md ring-2 ring-white animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Floating Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2.5 w-80 sm:w-96 bg-white rounded-3xl shadow-2xl border border-[#b9c0cb]/40 z-50 py-2.5 animate-in fade-in zoom-in-95 duration-150 overflow-hidden">
          {/* Header */}
          <div className="px-4 py-2.5 border-b border-[#f1f3f6] flex justify-between items-center bg-[#f8fafb]">
            <div className="flex items-center gap-2">
              <span className="font-heading font-bold text-xs text-[#333333]">Notifications</span>
              {unreadCount > 0 ? (
                <span className="text-[10px] font-extrabold bg-[#f0f8f9] text-[#3a7d84] border border-[#b6e0e4] px-2 py-0.5 rounded-full">
                  {unreadCount} New
                </span>
              ) : (
                <span className="text-[10px] text-[#759724] bg-[#f7fbe9] px-2 py-0.5 rounded-full font-bold">
                  All caught up
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={onMarkAllAsRead}
                className="text-[10.5px] text-[#51a8b1] hover:text-[#3a7d84] font-bold flex items-center gap-1 cursor-pointer transition hover:underline"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                Mark all read
              </button>
            )}
          </div>

          {/* Notifications Scrollable List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-[#f8fafb]">
            {notifications.length === 0 ? (
              <div className="text-center py-10 px-4 text-xs text-[#4a5462] space-y-2">
                <div className="w-10 h-10 rounded-2xl bg-[#f8fafb] border border-[#b9c0cb]/30 mx-auto flex items-center justify-center text-[#b9c0cb]">
                  <Inbox className="w-5 h-5" />
                </div>
                <p className="font-semibold text-[#333333]">No notifications yet</p>
                <p className="text-[11px] text-[#4a5462]/80">Task assignments and project updates will appear here in real-time.</p>
              </div>
            ) : (
              notifications.map((item) => (
                <div
                  key={item._id}
                  onClick={() => handleItemClick(item)}
                  className={`p-3.5 text-xs transition-colors cursor-pointer flex items-start gap-3 hover:bg-[#f0f8f9]/50 ${
                    !item.isRead ? 'bg-[#f0f8f9]/30 font-medium' : 'bg-white text-[#4a5462]'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${
                    !item.isRead 
                      ? 'bg-[#51a8b1] text-white shadow-2xs' 
                      : 'bg-[#f8fafb] text-[#b9c0cb] border border-[#b9c0cb]/30'
                  }`}>
                    {!item.isRead ? <Sparkles className="w-4 h-4" /> : <Bell className="w-4 h-4" />}
                  </div>

                  <div className="flex-1 min-w-0 space-y-0.5">
                    <div className="flex items-start justify-between gap-2">
                      <p className={`text-xs leading-tight font-bold truncate ${
                        !item.isRead ? 'text-[#333333]' : 'text-[#4a5462]'
                      }`}>
                        {item.title}
                      </p>
                      <span className="text-[9.5px] text-[#b9c0cb] font-mono whitespace-nowrap flex-shrink-0">
                        {formatRelativeTime(item.createdAt)}
                      </span>
                    </div>

                    <p className="text-[11px] text-[#4a5462] leading-relaxed line-clamp-2">
                      {item.message}
                    </p>

                    <span className="text-[10px] text-[#51a8b1] font-semibold flex items-center gap-1 pt-0.5">
                      <span>Click to view details</span>
                      <ArrowRight className="w-2.5 h-2.5" />
                    </span>
                  </div>

                  {!item.isRead && (
                    <span className="w-2 h-2 rounded-full bg-rose-500 flex-shrink-0 mt-1.5 shadow-xs ring-1 ring-white" />
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
