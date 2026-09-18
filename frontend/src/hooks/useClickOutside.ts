'use client';

import { useEffect, useRef, RefObject } from 'react';

interface UseClickOutsideOptions {
  /** If false, listeners won't be active (useful when modal/dropdown is closed) */
  enabled?: boolean;
  /** If true, pressing Escape key will also trigger the handler. Default: true */
  listenForEscape?: boolean;
  /** Mouse event type to listen to. Default: 'mousedown' */
  eventType?: 'mousedown' | 'mouseup' | 'click';
}

/**
 * Custom hook to detect clicks outside a referenced DOM element and trigger a callback.
 * Also optionally handles closing when the Escape key is pressed.
 *
 * @param handler - Callback executed when outside click or Escape key occurs
 * @param options - Configuration options (enabled, listenForEscape, eventType)
 * @returns Ref to attach to the target element container
 */
export function useClickOutside<T extends HTMLElement = HTMLElement>(
  handler: (event: MouseEvent | TouchEvent | KeyboardEvent) => void,
  options: UseClickOutsideOptions = {}
): RefObject<T> {
  const { enabled = true, listenForEscape = true, eventType = 'mousedown' } = options;
  const ref = useRef<T>(null);
  const handlerRef = useRef(handler);

  // Keep latest handler reference without triggering effect re-subscriptions
  useEffect(() => {
    handlerRef.current = handler;
  }, [handler]);

  useEffect(() => {
    if (!enabled) return;

    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      const el = ref.current;
      if (!el) return;

      // If the clicked target is inside the container or target element, ignore
      if (el.contains(event.target as Node)) {
        return;
      }

      handlerRef.current(event);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (listenForEscape && event.key === 'Escape') {
        handlerRef.current(event);
      }
    };

    document.addEventListener(eventType, handlePointerDown, true);
    document.addEventListener('touchstart', handlePointerDown, true);

    if (listenForEscape) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener(eventType, handlePointerDown, true);
      document.removeEventListener('touchstart', handlePointerDown, true);
      if (listenForEscape) {
        document.removeEventListener('keydown', handleKeyDown);
      }
    };
  }, [enabled, listenForEscape, eventType]);

  return ref;
}
