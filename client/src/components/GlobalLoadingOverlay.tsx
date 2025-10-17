import { useEffect, useMemo, useRef, useState } from "react";
import { useIsFetching, useIsMutating } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import Loader from "@/components/Loader";

/**
 * Displays a full-screen loading overlay whenever:
 * - any React Query fetch is in-flight
 * - any React Query mutation is in-flight
 * - auth context is performing startup/login checks
 *
 * Includes a small debounce/minimum display to avoid flicker on very fast requests.
 */
export default function GlobalLoadingOverlay() {
  const isFetching = useIsFetching();
  const isMutating = useIsMutating();
  const { isLoading: isAuthLoading } = useAuth();

  const shouldShow = isAuthLoading || isFetching > 0 || isMutating > 0;

  // Debounce and minimum visible duration
  const [visible, setVisible] = useState(false);
  const showTimeoutRef = useRef<number | null>(null);
  const hideTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    // Clear previous timers
    if (showTimeoutRef.current) window.clearTimeout(showTimeoutRef.current);
    if (hideTimeoutRef.current) window.clearTimeout(hideTimeoutRef.current);

    if (shouldShow) {
      // Wait 150ms before showing to prevent flicker on micro-requests
      showTimeoutRef.current = window.setTimeout(() => {
        setVisible(true);
      }, 150);
    } else {
      // Keep overlay for at least 250ms once visible to smooth transitions
      hideTimeoutRef.current = window.setTimeout(() => {
        setVisible(false);
      }, 250);
    }

    return () => {
      if (showTimeoutRef.current) window.clearTimeout(showTimeoutRef.current);
      if (hideTimeoutRef.current) window.clearTimeout(hideTimeoutRef.current);
    };
  }, [shouldShow]);

  const overlay = useMemo(() => (
    <div className="pointer-events-none">
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-white/70">
        <Loader />
      </div>
    </div>
  ), []);

  if (!visible) return null;
  return overlay;
}


