'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { notificationsApi, INotificationItem } from '../../lib/api/notifications.api';
import { AppSidebar } from './AppSidebar';
import { AppHeader } from './AppHeader';
import { NotificationDetailModal } from './NotificationDetailModal';

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const isAuthPage = pathname === '/login' || pathname === '/';

  const [collapsed, setCollapsed] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [notifications, setNotifications] = useState<INotificationItem[]>([]);
  const [isNotifOpen, setIsNotifOpen] = useState<boolean>(false);
  const [selectedNotification, setSelectedNotification] = useState<INotificationItem | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const fetchNotifications = useCallback(async () => {
    if (typeof window === 'undefined') return;
    const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
    if (!token) return;

    try {
      const res = await notificationsApi.getNotifications();
      setNotifications(res.notifications || []);
    } catch {
      // Ignore background network issues
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        try { setCurrentUser(JSON.parse(storedUser)); } catch {}
      }

      // If on protected route without token, redirect to /login
      if (!token && pathname !== '/login' && pathname !== '/') {
        router.replace('/login');
      }
    }

    const token = typeof window !== 'undefined' ? (localStorage.getItem('token') || localStorage.getItem('accessToken')) : null;
    if (!token) return;

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 10000);
    return () => clearInterval(interval);
  }, [fetchNotifications, pathname, router]);

  const handleMarkAsRead = async (id: string) => {
    try {
      await notificationsApi.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
    } catch {}
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationsApi.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch {}
  };

  const handleSelectNotification = (item: INotificationItem) => {
    setIsNotifOpen(false);
    setSelectedNotification(item);
  };

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('accessToken');
      localStorage.removeItem('user');
      router.push('/login');
    }
  };

  // Full Screen Viewport for Login and Auth Pages (NO sidebar, NO header)
  if (isAuthPage) {
    return (
      <main className="min-h-screen w-full bg-[#2f4154] overflow-x-hidden">
        {children}
      </main>
    );
  }

  return (
    <div className="min-h-screen flex bg-[#f8fafb] text-[#333333] font-sans">
      {/* ── Left Sidebar Navigation Panel ───────────────────── */}
      <AppSidebar
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed(!collapsed)}
        currentUser={currentUser}
        onLogout={handleLogout}
      />

      {/* ── Main App Container with Top Header ──────────────── */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        <AppHeader
          currentUser={currentUser}
          notifications={notifications}
          isNotifOpen={isNotifOpen}
          onToggleNotif={() => setIsNotifOpen(!isNotifOpen)}
          onMarkAsRead={handleMarkAsRead}
          onMarkAllAsRead={handleMarkAllAsRead}
          onSelectNotification={handleSelectNotification}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />

        {/* Page Content */}
        <main className="flex-1 min-w-0 p-3 sm:p-4 md:p-6 overflow-x-hidden">
          {children}
        </main>
      </div>

      {/* ── Notification Full Detail & Direct Routing Modal ── */}
      <NotificationDetailModal
        notification={selectedNotification}
        isOpen={Boolean(selectedNotification)}
        onClose={() => setSelectedNotification(null)}
      />
    </div>
  );
}