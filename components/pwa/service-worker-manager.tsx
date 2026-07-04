'use client';

import { useEffect } from 'react';
import { toast } from 'sonner';

/**
 * Registers the service worker and drives the update flow. A new version never
 * swaps assets silently: when a fresh worker finishes installing, we surface a
 * "Refresh" toast. Clicking it posts SKIP_WAITING (answered by app/sw.ts) and the
 * controllerchange listener reloads once the new worker takes control. Polls for
 * updates every 60s. No-op outside production and where SW is unsupported.
 */
export function ServiceWorkerManager() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') return;
    if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;

    let interval: ReturnType<typeof setInterval> | undefined;

    function promptUpdate(worker: ServiceWorker) {
      toast('New version available', {
        description: 'Refresh to load the latest ShieldPay.',
        duration: Infinity,
        action: {
          label: 'Refresh',
          onClick: () => {
            worker.postMessage({ type: 'SKIP_WAITING' });
            // Fallback in case the controllerchange event is missed.
            setTimeout(() => window.location.reload(), 2000);
          },
        },
      });
    }

    navigator.serviceWorker
      .register('/sw.js')
      .then((reg) => {
        if (reg.waiting) promptUpdate(reg.waiting);
        reg.addEventListener('updatefound', () => {
          const installing = reg.installing;
          if (!installing) return;
          installing.addEventListener('statechange', () => {
            if (installing.state === 'installed' && navigator.serviceWorker.controller) {
              promptUpdate(installing);
            }
          });
        });
        interval = setInterval(() => {
          reg.update().catch(() => {});
        }, 60_000);
      })
      .catch(() => {});

    let reloaded = false;
    const onControllerChange = () => {
      if (reloaded) return;
      reloaded = true;
      window.location.reload();
    };
    navigator.serviceWorker.addEventListener('controllerchange', onControllerChange);

    return () => {
      if (interval) clearInterval(interval);
      navigator.serviceWorker.removeEventListener('controllerchange', onControllerChange);
    };
  }, []);

  return null;
}
