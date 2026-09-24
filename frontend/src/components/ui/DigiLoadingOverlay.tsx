'use client';

import React, { useState, useEffect } from 'react';
import { Lottie } from 'lottie-react';
import loaderAnimationData from '../../../public/lottie/digitoppers-loader.json';

interface DigiLoadingOverlayProps {
  message?: string;
  subtext?: string;
  onDismiss?: () => void;
  fullScreen?: boolean;
}

export default function DigiLoadingOverlay({
  message = 'Loading DigiToppers...',
  subtext = 'Please wait while we prepare your workspace',
  onDismiss,
  fullScreen = true,
}: DigiLoadingOverlayProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Prevent background scrolling when loading overlay is active
    if (fullScreen) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [fullScreen]);

  if (!mounted) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Loading"
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center transition-all duration-300 ${
        fullScreen ? 'w-screen h-screen' : 'w-full h-full'
      } bg-slate-950/70 backdrop-blur-md animate-fade-in`}
    >
      {/* Ambient glowing backdrop circle */}
      <div className="absolute w-72 h-72 rounded-full bg-cyan-500/15 blur-3xl -top-10 -left-10 pointer-events-none animate-pulse" />
      <div className="absolute w-72 h-72 rounded-full bg-emerald-500/15 blur-3xl -bottom-10 -right-10 pointer-events-none animate-pulse" />

      {/* Modern Glass Container */}
      <div className="relative flex flex-col items-center justify-center p-8 sm:p-10 rounded-3xl bg-slate-900/90 border border-slate-700/60 shadow-2xl shadow-cyan-950/40 max-w-sm sm:max-w-md w-[90%] text-center backdrop-blur-xl">
        
        {/* Lottie Animation Wrapper */}
        <div className="relative w-44 h-44 sm:w-52 sm:h-52 flex items-center justify-center mb-4">
          <Lottie
            src={loaderAnimationData}
            loop={true}
            autoplay={true}
            className="w-full h-full object-contain filter drop-shadow-[0_8px_16px_rgba(77,168,176,0.35)]"
          />
        </div>

        {/* Loading Text & Status */}
        <div className="space-y-1.5 z-10">
          <h3 className="text-lg sm:text-xl font-bold tracking-wide bg-gradient-to-r from-cyan-300 via-teal-200 to-emerald-300 bg-clip-text text-transparent animate-pulse">
            {message}
          </h3>
          <p className="text-xs sm:text-sm text-slate-400 font-medium">
            {subtext}
          </p>
        </div>

        {/* Progress bar shimmer effect */}
        <div className="w-48 h-1.5 bg-slate-800 rounded-full overflow-hidden mt-5 border border-slate-700/50">
          <div className="h-full bg-gradient-to-r from-cyan-400 via-teal-400 to-emerald-400 rounded-full w-full animate-[progress_1.8s_ease-in-out_infinite] origin-left-right" />
        </div>

        {/* Optional Manual Dismiss for testing */}
        {onDismiss && (
          <button
            onClick={onDismiss}
            type="button"
            className="mt-6 text-[11px] font-medium text-slate-500 hover:text-slate-300 transition-colors uppercase tracking-widest hover:underline"
          >
            Cancel / Dismiss
          </button>
        )}
      </div>
    </div>
  );
}
