import { useEffect, useRef } from 'react';

/**
 * Screen Wake Lock hook to prevent mobile device from dimming or locking screen
 * while actively viewing or playing a match.
 */
export function useWakeLock(enabled: boolean = true) {
  const sentinelRef = useRef<any>(null);

  useEffect(() => {
    if (!enabled) {
      if (sentinelRef.current) {
        sentinelRef.current.release().catch(() => {});
        sentinelRef.current = null;
      }
      return;
    }

    // Check if Wake Lock API is supported in this browser
    if (typeof navigator === 'undefined' || !('wakeLock' in navigator)) {
      return;
    }

    let isMounted = true;

    const requestLock = async () => {
      try {
        if (document.visibilityState === 'visible' && !sentinelRef.current) {
          const sentinel = await (navigator as any).wakeLock.request('screen');
          if (!isMounted) {
            sentinel.release().catch(() => {});
            return;
          }
          sentinelRef.current = sentinel;
          sentinel.addEventListener('release', () => {
            sentinelRef.current = null;
          });
        }
      } catch {
        // Battery saver or system restrictions can reject wake lock; fail gracefully
      }
    };

    requestLock();

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        requestLock();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      isMounted = false;
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (sentinelRef.current) {
        sentinelRef.current.release().catch(() => {});
        sentinelRef.current = null;
      }
    };
  }, [enabled]);
}
