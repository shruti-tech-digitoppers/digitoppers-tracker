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

    // Auto-exit after 3s (start exit animation), then remove after 400ms
    hideTimerRef.current = setTimeout(() => {
      setToast(prev => ({ ...prev, exiting: true }));
      exitTimerRef.current = setTimeout(() => {
        setToast(prev => ({ ...prev, visible: false, exiting: false }));
      }, 400);
    }, 3000);
  }, []);

  return (
    <PermissionContext.Provider value={{ permissions, isReadOnly, showReadOnlyToast }}>
      {children}

      {/* ── Global Read-Only Action Toast (bottom-center, slides up) ── */}
      {toast.visible && (
        <div
          key={toast.key}
          className={`
            fixed bottom-6 left-1/2 z-[9999] pointer-events-auto
            transition-all duration-[400ms] ease-out
            ${toast.exiting
              ? 'opacity-0 translate-y-6 scale-95'
              : 'opacity-100 translate-y-0 scale-100'
            }
          `}
          style={{
            transform: toast.exiting
              ? 'translateX(-50%) translateY(24px) scale(0.95)'
              : 'translateX(-50%) translateY(0) scale(1)',
            animation: toast.exiting ? undefined : 'readOnlyToastSlideUp 0.38s cubic-bezier(0.34,1.56,0.64,1) both',
          }}
          role="alert"
          aria-live="assertive"
        >
          <div
            className="
              relative flex items-center gap-3 px-5 py-3.5 rounded-2xl
              bg-gradient-to-r from-[#1a2f3f] to-[#1e3a4c]
              border border-white/10
              text-white min-w-[300px] max-w-[440px]
              overflow-hidden
            "
            style={{ boxShadow: '0 10px 40px rgba(0,0,0,0.45), 0 0 0 1px rgba(255,255,255,0.06)' }}
          >
            {/* Icon badge */}
            <div className="w-8 h-8 rounded-xl bg-amber-400/15 flex items-center justify-center flex-shrink-0 border border-amber-400/25">
              <ShieldAlert className="w-4 h-4 text-amber-400" />
            </div>

            {/* Message */}
            <p className="text-[13px] font-semibold leading-snug flex-1 tracking-wide">
              {toast.message}
            </p>

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
              className="p-1 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition cursor-pointer flex-shrink-0 ml-1"
              aria-label="Dismiss"
            >
              <X className="w-3.5 h-3.5" />
            </button>

            {/* Animated progress bar countdown */}
            <div
              className="absolute bottom-0 left-0 right-0 h-[3px] bg-amber-400/25"
            >
              <div
                className="h-full bg-amber-400 rounded-full origin-left"
                style={{ animation: 'readOnlyToastProgress 3s linear forwards' }}
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
            transform: translateX(-50%) translateY(32px) scale(0.92);
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
