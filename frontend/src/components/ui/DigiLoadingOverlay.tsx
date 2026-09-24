'use client';

import React, { useState, useEffect, useRef } from 'react';
import loaderAnimationData from '../../../public/lottie/digitoppers-loader.json';

interface DigiLoadingOverlayProps {
  message?: string;
  subtext?: string;
  onDismiss?: () => void;
  fullScreen?: boolean;
}

function LottiePlayer() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let anim: any = null;
    let isMounted = true;

    // Dynamically import lottie-web for clean client-side SVG rendering
    import('lottie-web').then((lottieModule) => {
      if (!isMounted || !containerRef.current) return;
      const lottie = lottieModule.default || lottieModule;
      
      // Clean up previous animations in container if any
      containerRef.current.innerHTML = '';

      anim = lottie.loadAnimation({
        container: containerRef.current,
        renderer: 'svg',
        loop: true,
        autoplay: true,
        animationData: loaderAnimationData,
        rendererSettings: {
          preserveAspectRatio: 'xMidYMid meet',
          progressiveLoad: true,
        },
      });
    });

    return () => {
      isMounted = false;
      if (anim) {
        anim.destroy();
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="w-full h-full flex items-center justify-center filter drop-shadow-[0_10px_25px_rgba(77,168,176,0.45)]"
      style={{ minHeight: '180px', minWidth: '180px' }}
    />
  );
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
      } bg-slate-950/75 backdrop-blur-md animate-fade-in`}
    >
      {/* Ambient glowing backdrop circle */}
      <div className="absolute w-80 h-80 rounded-full bg-cyan-500/20 blur-3xl -top-12 -left-12 pointer-events-none animate-pulse" />
      <div className="absolute w-80 h-80 rounded-full bg-emerald-500/20 blur-3xl -bottom-12 -right-12 pointer-events-none animate-pulse" />

      {/* Modern Glass Container */}
      <div className="relative flex flex-col items-center justify-center p-8 sm:p-10 rounded-3xl bg-slate-900/90 border border-slate-700/70 shadow-2xl shadow-cyan-950/50 max-w-sm sm:max-w-md w-[92%] text-center backdrop-blur-xl">
        
        {/* Lottie Animation Display */}
        <div className="relative w-48 h-48 sm:w-56 sm:h-56 flex items-center justify-center mb-3">
          <LottiePlayer />
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
        <div className="w-52 h-1.5 bg-slate-800 rounded-full overflow-hidden mt-6 border border-slate-700/50">
          <div className="h-full bg-gradient-to-r from-cyan-400 via-teal-400 to-emerald-400 rounded-full w-full animate-[progress_1.8s_ease-in-out_infinite] origin-left-right" />
        </div>

        {/* Manual Dismiss for testing */}
        {onDismiss && (
          <button
            onClick={onDismiss}
            type="button"
            className="mt-6 px-4 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-[11px] font-semibold text-slate-400 hover:text-slate-200 transition-all uppercase tracking-wider cursor-pointer"
          >
            Close / Dismiss
          </button>
        )}
      </div>
    </div>
  );
}
