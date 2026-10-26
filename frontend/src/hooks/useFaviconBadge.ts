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
      // Find or create the primary favicon link
      let link = document.querySelector("link[rel*='icon']") as HTMLLinkElement | null;
      if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.head.appendChild(link);
      }

      if (unreadCount <= 0) {
        // Reset to original icon cleanly with cache-busting timestamp
        const cleanIconHref = `/digitoppers-icon.png?v=${Date.now()}`;
        const newLink = link.cloneNode(true) as HTMLLinkElement;
        newLink.href = cleanIconHref;
        link.parentNode?.replaceChild(newLink, link);
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

        // Display string (e.g. "1", "19", "22", or "99+")
        const displayCount = unreadCount > 99 ? '99+' : String(unreadCount);

        const drawRoundedBadge = (
          x: number,
          y: number,
          w: number,
          h: number,
          r: number,
          fillColor: string
        ) => {
          ctx.beginPath();
          ctx.moveTo(x + r, y);
          ctx.lineTo(x + w - r, y);
          ctx.quadraticCurveTo(x + w, y, x + w, y + r);
          ctx.lineTo(x + w, y + h - r);
          ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
          ctx.lineTo(x + r, y + h);
          ctx.quadraticCurveTo(x, y + h, x, y + h - r);
          ctx.lineTo(x, y + r);
          ctx.quadraticCurveTo(x, y, x + r, y);
          ctx.closePath();
          ctx.fillStyle = fillColor;
          ctx.fill();
        };

        // Vibrant Red: #dc2626
        const redColor = '#dc2626';

        if (displayCount.length === 1) {
          // Single digit: Big bold circle
          const radius = 22;
          const cx = size - radius - 1;
          const cy = radius + 1;

          // White border
          ctx.beginPath();
          ctx.arc(cx, cy, radius + 4.5, 0, 2 * Math.PI);
          ctx.fillStyle = '#ffffff';
          ctx.fill();

          // Vibrant Red Badge
          ctx.beginPath();
          ctx.arc(cx, cy, radius, 0, 2 * Math.PI);
          ctx.fillStyle = redColor;
          ctx.fill();

          // Badge Number Text
          ctx.font = '900 28px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
          ctx.fillStyle = '#ffffff';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(displayCount, cx, cy + 1.5);
        } else if (displayCount.length === 2) {
          // Two digits (e.g. 19, 22): Large pill shape to fit both digits clearly without clipping
          const pillW = 50;
          const pillH = 36;
          const pillR = 18;
          const px = size - pillW - 1;
          const py = 1;

          // White outer border ring
          drawRoundedBadge(px - 4, py - 4, pillW + 8, pillH + 8, pillR + 4, '#ffffff');

          // Vibrant Red Badge Pill
          drawRoundedBadge(px, py, pillW, pillH, pillR, redColor);

          // Large Bold Number
          ctx.font = '900 24px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
          ctx.fillStyle = '#ffffff';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(displayCount, px + pillW / 2, py + pillH / 2 + 1.5);
        } else {
          // 3 digits (e.g. 99+)
          const pillW = 56;
          const pillH = 36;
          const pillR = 18;
          const px = size - pillW;
          const py = 1;

          // White outer border ring
          drawRoundedBadge(px - 3.5, py - 3.5, pillW + 7, pillH + 7, pillR + 3.5, '#ffffff');

          // Vibrant Red Badge Pill
          drawRoundedBadge(px, py, pillW, pillH, pillR, redColor);

          // Text
          ctx.font = '900 20px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
          ctx.fillStyle = '#ffffff';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(displayCount, px + pillW / 2, py + pillH / 2 + 1.5);
        }

        const newFaviconUrl = canvas.toDataURL('image/png');

        // Replace link element in DOM to force browser tab repaint
        const newLink = link!.cloneNode(true) as HTMLLinkElement;
        newLink.href = newFaviconUrl;
        link!.parentNode?.replaceChild(newLink, link!);
      };
    };

    updateFavicon();
  }, [unreadCount]);
}
