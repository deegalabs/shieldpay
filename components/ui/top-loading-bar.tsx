'use client';

import * as React from 'react';
import { usePathname } from 'next/navigation';

/**
 * A thin indeterminate progress bar pinned to the top of the viewport, in the
 * brand-to-verified gradient. Mount <TopLoadingBar /> once in the root layout;
 * drive it imperatively from anywhere with startTopLoading() / stopTopLoading()
 * around an async action (e.g. deleting a record before a redirect). It also
 * completes on its own when a client navigation finishes.
 */
type Listener = (active: boolean) => void;
const listeners = new Set<Listener>();
let active = false;

export function startTopLoading() {
  active = true;
  listeners.forEach((l) => l(true));
}

export function stopTopLoading() {
  active = false;
  listeners.forEach((l) => l(false));
}

export function TopLoadingBar() {
  const pathname = usePathname();
  const [visible, setVisible] = React.useState(false);
  const [progress, setProgress] = React.useState(0);
  const timer = React.useRef<ReturnType<typeof setInterval> | null>(null);
  const fade = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const begin = React.useCallback(() => {
    if (fade.current) clearTimeout(fade.current);
    setVisible(true);
    setProgress(8);
    if (timer.current) clearInterval(timer.current);
    // Ease toward ~90% and hold there; a real completion snaps it to 100%.
    timer.current = setInterval(() => {
      setProgress((p) => (p < 90 ? p + (90 - p) * 0.12 : p));
    }, 200);
  }, []);

  const end = React.useCallback(() => {
    if (timer.current) clearInterval(timer.current);
    setProgress(100);
    fade.current = setTimeout(() => {
      setVisible(false);
      setProgress(0);
    }, 280);
  }, []);

  React.useEffect(() => {
    const l: Listener = (on) => (on ? begin() : end());
    listeners.add(l);
    if (active) begin();
    return () => {
      listeners.delete(l);
      if (timer.current) clearInterval(timer.current);
      if (fade.current) clearTimeout(fade.current);
    };
  }, [begin, end]);

  // A finished client navigation (pathname change) completes any active bar.
  React.useEffect(() => {
    if (visible) end();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  if (!visible) return null;
  return (
    <div aria-hidden className="pointer-events-none fixed inset-x-0 top-0 z-[200] h-0.5">
      <div
        className="h-full rounded-r-full bg-gradient-to-r from-brand to-verified shadow-[0_0_10px_hsl(var(--brand)/0.6)] transition-[width,opacity] duration-200 ease-out"
        style={{ width: `${progress}%`, opacity: progress >= 100 ? 0 : 1 }}
      />
    </div>
  );
}
