'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { notificationsApi, INotificationItem } from '../../lib/api/notifications.api';
import { authApi } from '../../lib/api/auth.api';
import { AppSidebar } from './AppSidebar';
import { AppHeader } from './AppHeader';
import { NotificationDetailModal } from './NotificationDetailModal';
import { SearchProvider } from '../../context/SearchContext';
import { LoadingProvider } from '../../context/LoadingContext';
import { useFaviconBadge } from '../../hooks/useFaviconBadge';

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const isLoginPage = pathname === '/login';
  const isPublicViewPage = pathname === '/dashboard' || pathname === '/' || pathname.startsWith('/tracker');

  const [collapsed, setCollapsed] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [notifications, setNotifications] = useState<INotificationItem[]>([]);
  const [isNotifOpen, setIsNotifOpen] = useState<boolean>(false);
  const [selectedNotification, setSelectedNotification] = useState<INotificationItem | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [mounted, setMounted] = useState<boolean>(false);

  // Calculate unread notification count
  const unreadNotificationsCount = notifications.filter((n) => !n.isRead).length;

  // Dynamically update browser tab favicon and document title with unread badge
  useFaviconBadge(unreadNotificationsCount);

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

  // 1. Initial User Hydration & Route Protection
  useEffect(() => {
    setMounted(true);
    if (typeof window === 'undefined') return;
    const token = localStorage.getItem('token') || localStorage.getItem('accessToken');

    if (!token) {
      setIsAuthenticated(false);
      setCurrentUser(null);
      if (!isPublicViewPage && !isLoginPage) {
        router.replace('/login');
      }
      return;
    }

    setIsAuthenticated(true);
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try { setCurrentUser(JSON.parse(storedUser)); } catch {}
    }

    authApi.getMe().then((res) => {
      if (res.user) {
        setCurrentUser(res.user);
        try { localStorage.setItem('user', JSON.stringify(res.user)); } catch {}
      }
    }).catch(() => {
      // If token expired / invalid
      setIsAuthenticated(false);
      setCurrentUser(null);
      if (!isPublicViewPage && !isLoginPage) {
        router.replace('/login');
      }
    });
  }, [pathname, router, isPublicViewPage, isLoginPage]);

  // 2. Background Notification Polling (Only when authenticated)
  useEffect(() => {
    if (typeof window === 'undefined' || isLoginPage || !isAuthenticated) return;
    const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
    if (!token) return;

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 10000);
    return () => clearInterval(interval);
  }, [fetchNotifications, isLoginPage, isAuthenticated]);

  const handleToggleCollapse = useCallback(() => {
    setCollapsed((prev) => !prev);
  }, []);

  const handleToggleNotif = useCallback(() => {
    setIsNotifOpen((prev) => !prev);
  }, []);

  const handleMarkAsRead = useCallback(async (id: string) => {
    try {
      await notificationsApi.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
    } catch {}
  }, []);

  const handleMarkAllAsRead = useCallback(async () => {
    try {
      await notificationsApi.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch {}
  }, []);

  const handleSelectNotification = useCallback((item: INotificationItem) => {
    setIsNotifOpen(false);
    setSelectedNotification(item);
  }, []);

  const handleLogout = useCallback(() => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('accessToken');
      localStorage.removeItem('digitopper_token');
      localStorage.removeItem('user');
      setIsAuthenticated(false);
      setCurrentUser(null);
      router.push('/login');
    }
  }, [router]);

  // Full Screen Viewport for Login Page (NO sidebar, NO header)
  if (isLoginPage) {
    return (
      <LoadingProvider>
        <main className="min-h-screen w-full bg-[#2f4154] overflow-x-hidden">
          {children}
        </main>
      </LoadingProvider>
    );
  }

  // Consistent Shell Layout across SSR and Client Hydration
  return (
    <LoadingProvider>
      <SearchProvider>
        <div className="min-h-screen flex bg-[#f8fafb] text-[#333333] font-sans">
          {/* ── Left Sidebar Navigation Panel ───────────────────── */}
          <AppSidebar
            collapsed={collapsed}
            onToggleCollapse={handleToggleCollapse}
            currentUser={currentUser}
            onLogout={handleLogout}
            unreadCount={unreadNotificationsCount}
          />

          {/* ── Main App Container with Top Header ──────────────── */}
          <div className="flex-1 flex flex-col min-w-0 min-h-screen">
            <AppHeader
              currentUser={currentUser}
              notifications={notifications}
              isNotifOpen={isNotifOpen}
              onToggleNotif={handleToggleNotif}
              onMarkAsRead={handleMarkAsRead}
              onMarkAllAsRead={handleMarkAllAsRead}
              onSelectNotification={handleSelectNotification}
              collapsed={collapsed}
              onToggleSidebar={handleToggleCollapse}
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
      </SearchProvider>
    </LoadingProvider>
  );
}