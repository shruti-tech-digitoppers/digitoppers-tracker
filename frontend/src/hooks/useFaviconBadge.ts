'use client';

import { useEffect } from 'react';

/**
 * Dynamically formats document title to:
 * - If unreadCount > 0: `({unreadCount}) {PageName} - DigiToppers`
 * - If unreadCount === 0: `{PageName} - DigiToppers`
 * 
 * Example:
 * - `(2) Dashboard - DigiToppers`
 * - `(2) Tracker - DigiToppers`
 * - `Dashboard - DigiToppers`
 * - `Tracker - DigiToppers`
 */
export function useFaviconBadge(unreadCount: number = 0, pathname?: string) {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const currentPath = pathname || window.location.pathname || '/';

    const getPageName = (path: string) => {
      if (path.startsWith('/dashboard') || path === '/') return 'Dashboard';
      if (path.startsWith('/tracker')) return 'Tracker';
      if (path.startsWith('/projects')) return 'Projects';
      if (path.startsWith('/requests')) return 'Requests';
      if (path.startsWith('/employees')) return 'Employees';
      if (path.startsWith('/activity')) return 'Activity Logs';
      if (path.startsWith('/login')) return 'Login';
      return 'Project Tracker';
    };

    const pageName = getPageName(currentPath);
    const countPrefix = unreadCount > 0 ? `(${unreadCount > 99 ? '99+' : unreadCount}) ` : '';
    const formattedTitle = `${countPrefix}${pageName} - DigiToppers`;

    if (currentPath === '/login' || currentPath.startsWith('/login')) {
      if (document.title !== 'Login - DigiToppers') {
        document.title = 'Login - DigiToppers';
      }
      return;
    }

    if (document.title !== formattedTitle) {
      document.title = formattedTitle;
    }

    // Keep clean standard favicon icon
    const linkIcons: HTMLLinkElement[] = Array.from(
      document.querySelectorAll("link[rel*='icon']")
    );
    linkIcons.forEach((link) => {
      if (link.href && !link.href.endsWith('/digitoppers-icon.png')) {
        link.href = '/digitoppers-icon.png';
      }
    });
  }, [unreadCount, pathname]);
}
