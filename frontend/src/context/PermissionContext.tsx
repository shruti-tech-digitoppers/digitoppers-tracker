'use client';

import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { Permissions } from '../hooks/usePermissions';
import { ShieldAlert, X } from 'lucide-react';

interface PermissionContextValue {
  permissions: Permissions;
  isReadOnly: boolean;
  /** Call this anywhere to fire the global read-only bottom toast */
  showReadOnlyToast: (message?: string) => void;
}

const defaultPermissions: Permissions = {
  canEdit: false,
  canManageEmployees: false,
  canEditTimeline: false,
  canApproveRequests: false,
  canRequestProject: false,
  role: null,
};

const PermissionContext = createContext<PermissionContextValue>({
  permissions: defaultPermissions,
  isReadOnly: true,
  showReadOnlyToast: () => {},
});

interface ToastState {
  visible: boolean;
  exiting: boolean;
  message: string;
  key: number;
}

export const PermissionProvider = ({
  children,
  permissions,
}: {
  children: React.ReactNode;
  permissions: Permissions;
}) => {
  const isReadOnly = !permissions.canEdit;

  const [toast, setToast] = useState<ToastState>({
    visible: false,
    exiting: false,
    message: '',
    key: 0,
  });

  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const exitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showReadOnlyToast = useCallback((message?: string) => {
    // Clear any pending timers
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    if (exitTimerRef.current) clearTimeout(exitTimerRef.current);

    const msg = message || '🔒 Read-only access — contact an Admin to make changes.';

    setToast(prev => ({ visible: true, exiting: false, message: msg, key: prev.key + 1 }));

    // Auto-exit after 5s (start exit animation), then remove after 400ms
    hideTimerRef.current = setTimeout(() => {
      setToast(prev => ({ ...prev, exiting: true }));
      exitTimerRef.current = setTimeout(() => {
        setToast(prev => ({ ...prev, visible: false, exiting: false }));
      }, 400);
    }, 5000);
  }, []);

  return (
    <PermissionContext.Provider value={{ permissions, isReadOnly, showReadOnlyToast }}>
      {children}

      {/* ── Global Read-Only Action Toast (bottom-center, slides up) ── */}
      {toast.visible && (
        <div
          key={toast.key}
          className="fixed bottom-6 left-1/2 z-[9999] pointer-events-auto"
          style={{
            transform: toast.exiting
              ? 'translateX(-50%) translateY(28px) scale(0.94)'
              : 'translateX(-50%) translateY(0) scale(1)',
            opacity: toast.exiting ? 0 : 1,
            transition: toast.exiting ? 'all 0.4s ease-out' : undefined,
            animation: toast.exiting ? undefined : 'readOnlyToastSlideUp 0.4s cubic-bezier(0.34,1.56,0.64,1) both',
          }}
          role="alert"
          aria-live="assertive"
        >
          {/* Card */}
          <div
            style={{
              background: 'linear-gradient(135deg, #2f4154 0%, #243547 60%, #1e3040 100%)',
              boxShadow: '0 8px 36px rgba(47,65,84,0.45), 0 2px 8px rgba(81,168,177,0.18), 0 0 0 1px rgba(81,168,177,0.18)',
              minWidth: '320px',
              maxWidth: '460px',
            }}
            className="relative flex items-center gap-3.5 px-5 py-3.5 rounded-2xl overflow-hidden border border-[#51a8b1]/25"
          >
            {/* Left teal accent bar */}
            <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl bg-gradient-to-b from-[#51a8b1] to-[#3a7d84]" />

            {/* Icon badge — teal */}
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ml-1"
              style={{
                background: 'rgba(81,168,177,0.15)',
                border: '1px solid rgba(81,168,177,0.35)',
              }}
            >
              <ShieldAlert className="w-4.5 h-4.5" style={{ color: '#51a8b1' }} />
            </div>

            {/* Text block */}
            <div className="flex-1 min-w-0">
              <p
                className="text-[11px] font-bold uppercase tracking-widest mb-0.5"
                style={{ color: '#51a8b1', fontFamily: 'Montserrat, sans-serif' }}
              >
                Read-Only Access
              </p>
              <p
                className="text-[12.5px] font-medium leading-snug"
                style={{ color: '#d1dce8' }}
              >
                {toast.message.replace('🔒 ', '')}
              </p>
            </div>

            {/* Dismiss button */}
            <button
              type="button"
              onClick={() => {
                if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
                if (exitTimerRef.current) clearTimeout(exitTimerRef.current);
                setToast(prev => ({ ...prev, exiting: true }));
                exitTimerRef.current = setTimeout(() => {
                  setToast(prev => ({ ...prev, visible: false, exiting: false }));
                }, 400);
              }}
              className="p-1.5 rounded-lg transition cursor-pointer flex-shrink-0 ml-1"
              style={{ color: 'rgba(209,220,232,0.5)' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#d1dce8')}
              onMouseLeave={e => (e.currentTarget.style.color = 'rgba(209,220,232,0.5)')}
              aria-label="Dismiss"
            >
              <X className="w-3.5 h-3.5" />
            </button>

            {/* Green progress bar — matches #a8cf45 brand green */}
            <div
              className="absolute bottom-0 left-0 right-0 h-[3px]"
              style={{ background: 'rgba(168,207,69,0.18)' }}
            >
              <div
                className="h-full rounded-full"
                style={{
                  background: 'linear-gradient(90deg, #a8cf45, #8fbb2a)',
                  animation: 'readOnlyToastProgress 5s linear forwards',
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Keyframe animations */}
      <style>{`
        @keyframes readOnlyToastSlideUp {
          from {
            opacity: 0;
            transform: translateX(-50%) translateY(36px) scale(0.90);
          }
          40% {
            opacity: 1;
          }
          to {
            opacity: 1;
            transform: translateX(-50%) translateY(0) scale(1);
          }
        }
        @keyframes readOnlyToastProgress {
          from { width: 100%; }
          to   { width: 0%;   }
        }
      `}</style>
    </PermissionContext.Provider>
  );
};

/** Use this anywhere to get the current user's permissions + toast trigger */
export const usePermissionContext = () => useContext(PermissionContext);
