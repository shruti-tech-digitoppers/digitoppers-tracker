'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ShieldOff, Eye, X, ChevronDown, ChevronUp } from 'lucide-react';

export const SHOW_READ_ONLY_TOAST_EVENT = 'digitoppers:show-read-only-toast';

/**
 * Global helper to trigger the read-only toast from anywhere in the application.
 */
export function showReadOnlyToast(message?: string) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent(SHOW_READ_ONLY_TOAST_EVENT, {
        detail: { message: message || '🔒 Read-only access — contact an Admin to make changes.' },
      })
    );
  }
}

export const triggerReadOnlyToast = showReadOnlyToast;

interface ReadOnlyToastProps {
  userName?: string;
  defaultMessage?: string;
}

/**
 * Floating bottom-left toast shown to read-only (non-admin) users.
 * Auto-shows on mount or when triggered via showReadOnlyToast().
 */
export const ReadOnlyToast: React.FC<ReadOnlyToastProps> = ({ userName, defaultMessage }) => {
  const [visible, setVisible] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [currentMessage, setCurrentMessage] = useState<string>(defaultMessage || '');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autoHideRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Listen for global showReadOnlyToast events
    const handleToastEvent = (e: Event) => {
      const customEvent = e as CustomEvent<{ message?: string }>;
      const msg = customEvent.detail?.message;
      if (msg) setCurrentMessage(msg);
      setDismissed(false);
      setVisible(true);
      setCollapsed(false);

      if (autoHideRef.current) clearTimeout(autoHideRef.current);
      autoHideRef.current = setTimeout(() => {
        setVisible(false);
      }, 5500);
    };

    if (typeof window !== 'undefined') {
      window.addEventListener(SHOW_READ_ONLY_TOAST_EVENT, handleToastEvent);
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener(SHOW_READ_ONLY_TOAST_EVENT, handleToastEvent);
      }
      if (autoHideRef.current) clearTimeout(autoHideRef.current);
    };
  }, []);

  useEffect(() => {
    // If not triggered by event, show initial helper after slight delay only if userName was supplied
    if (userName && !currentMessage) {
      timerRef.current = setTimeout(() => setVisible(true), 800);
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [userName, currentMessage]);

  if (dismissed) return null;

  const tips = [
    currentMessage ? currentMessage.replace('🔒 ', '') : 'You can browse all projects and timelines.',
    'Forms are view-only — edits are disabled.',
    'Contact an Admin to request changes.',
  ];

  return (
    <div
      className={`
        fixed bottom-5 left-5 z-50 max-w-[300px] w-[300px]
        transition-all duration-500 ease-out
        ${visible ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0 pointer-events-none'}
      `}
      role="status"
      aria-live="polite"
    >
      {/* Card */}
      <div
        className="
          bg-white border border-[#e2e8f0] rounded-2xl shadow-xl
          overflow-hidden
          ring-1 ring-[#cbd5e1]/40
        "
        style={{ boxShadow: '0 8px 32px 0 rgba(44,104,112,0.13), 0 1.5px 6px 0 rgba(0,0,0,0.06)' }}
      >
        {/* Header */}
        <div className="flex items-center gap-2.5 px-3.5 py-2.5 bg-gradient-to-r from-[#f0f8f9] to-[#eaf5f6] border-b border-[#e2e8f0]">
          {/* Icon badge */}
          <div className="w-7 h-7 rounded-lg bg-[#2c6870]/10 flex items-center justify-center flex-shrink-0">
            <Eye className="w-3.5 h-3.5 text-[#2c6870] stroke-[2.2]" />
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-bold text-[#2c6870] leading-tight tracking-wide uppercase">
              Read-Only Access
            </p>
            {userName && (
              <p className="text-[10px] text-[#64748b] truncate mt-0.5">
                Hi <span className="font-semibold text-[#334155]">{userName}</span> 👋
              </p>
            )}
          </div>

          <div className="flex items-center gap-1 flex-shrink-0">
            {/* Collapse/expand */}
            <button
              type="button"
              onClick={() => setCollapsed((p) => !p)}
              className="p-1 rounded-lg text-[#94a3b8] hover:text-[#2c6870] hover:bg-[#e8f6f8] transition cursor-pointer"
              title={collapsed ? 'Expand' : 'Collapse'}
            >
              {collapsed ? (
                <ChevronUp className="w-3 h-3 stroke-[2.2]" />
              ) : (
                <ChevronDown className="w-3 h-3 stroke-[2.2]" />
              )}
            </button>
            {/* Dismiss */}
            <button
              type="button"
              onClick={() => setDismissed(true)}
              className="p-1 rounded-lg text-[#94a3b8] hover:text-rose-500 hover:bg-rose-50 transition cursor-pointer"
              title="Dismiss"
            >
              <X className="w-3 h-3 stroke-[2.2]" />
            </button>
          </div>
        </div>

        {/* Body — collapsible */}
        <div
          className={`transition-all duration-300 overflow-hidden ${
            collapsed ? 'max-h-0' : 'max-h-40'
          }`}
        >
          <div className="px-3.5 py-2.5 space-y-1.5">
            {/* Permission badge */}
            <div className="flex items-center gap-1.5 mb-2">
              <ShieldOff className="w-3 h-3 text-amber-500 flex-shrink-0 stroke-[2]" />
              <span className="text-[10px] text-[#78716c] font-medium">
                You don&apos;t have edit permissions
              </span>
            </div>

            {/* Tips list */}
            {tips.map((tip, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className="mt-0.5 w-4 h-4 rounded-full bg-[#e8f6f8] flex items-center justify-center flex-shrink-0">
                  <span className="text-[8px] font-bold text-[#2c6870]">{i + 1}</span>
                </span>
                <p className="text-[10.5px] text-[#475569] leading-snug">{tip}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
