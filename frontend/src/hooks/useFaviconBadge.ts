'use client';

import { useEffect } from 'react';

/**
 * Custom hook to dynamically draw an unread notification count badge
 * on the website favicon and document title.
 */
export function useFaviconBadge(unreadCount: number) {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // 1. Update Document Title with unread count
    const baseTitle = 'DigiToppers Project Tracker';
    const cleanCurrentTitle = document.title.replace(/^\(\d+\+?\)\s*/, '');
    const titleBase = cleanCurrentTitle.includes('DigiToppers') ? cleanCurrentTitle : baseTitle;

    if (unreadCount > 0) {
      document.title = `(${unreadCount > 99 ? '99+' : unreadCount}) ${titleBase}`;
    } else {
      document.title = titleBase;
    }

    // 2. Update Browser Favicon with dynamic Canvas badge
    const updateFavicon = () => {
      const linkIcons: HTMLLinkElement[] = Array.from(
        document.querySelectorAll("link[rel*='icon']")
      );

      if (unreadCount <= 0) {
        linkIcons.forEach((link) => {
          link.href = '/digitoppers-icon.png';
        });
        return;
      }

      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = '/digitoppers-icon.png';

      img.onload = () => {
        const canvas = document.createElement('canvas');
        const size = 64; // High-res 64x64 favicon canvas
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Draw base DigiToppers logo icon
        ctx.clearRect(0, 0, size, size);
        ctx.drawImage(img, 0, 0, size, size);

        // Draw Badge Background (Vibrant Rose Red with Soft Glow - 20% larger)
        const badgeRadius = 17;
        const badgeCenterX = size - badgeRadius;
        const badgeCenterY = badgeRadius;

        // White border ring around badge
        ctx.beginPath();
        ctx.arc(badgeCenterX, badgeCenterY, badgeRadius + 3.5, 0, 2 * Math.PI);
        ctx.fillStyle = '#ffffff';
        ctx.fill();

        // Red badge circle
        ctx.beginPath();
        ctx.arc(badgeCenterX, badgeCenterY, badgeRadius, 0, 2 * Math.PI);
        ctx.fillStyle = '#e11d48'; // Rose-600
        ctx.fill();

        // Badge Text (Unread Count)
        ctx.font = 'bold 19px "Montserrat", "Roboto", sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const displayCount = unreadCount > 9 ? '9+' : String(unreadCount);
        ctx.fillText(displayCount, badgeCenterX, badgeCenterY + 1);

        const newFaviconUrl = canvas.toDataURL('image/png');

        if (linkIcons.length > 0) {
          linkIcons.forEach((link) => {
            link.href = newFaviconUrl;
          });
        } else {
          const newLink = document.createElement('link');
          newLink.rel = 'icon';
          newLink.href = newFaviconUrl;
          document.head.appendChild(newLink);
        }
      };
    };

    updateFavicon();
  }, [unreadCount]);
}
