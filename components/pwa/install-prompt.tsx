'use client';

import { useEffect, useState } from 'react';
import { Share, X, Download } from 'lucide-react';

/**
 * Add-to-home-screen prompt (mobile only). On Chromium it captures the native
 * beforeinstallprompt and offers an Install button; on iOS Safari, which has no
 * such event, it shows the manual Share then "Add to Home Screen" hint. Dismissal
 * is remembered for 7 days, and it never shows once the app runs standalone. It
 * floats above the bottom tab bar (56px + safe area).
 */
const DISMISS_KEY = 'shieldpay:install-dismissed';
const DISMISS_DAYS = 7;
const AUTO_HIDE_MS = 20_000;

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

function dismissedRecently(): boolean {
  try {
    const raw = localStorage.getItem(DISMISS_KEY);
    if (!raw) return false;
    return Date.now() - Number(raw) < DISMISS_DAYS * 24 * 60 * 60 * 1000;
  } catch {
    return false;
  }
}

export function InstallPrompt() {
  const [visible, setVisible] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      // iOS Safari flag.
      (navigator as unknown as { standalone?: boolean }).standalone === true;
    if (standalone || dismissedRecently()) return;

    const ua = window.navigator.userAgent;
    const ios = /iphone|ipad|ipod/i.test(ua) && !/crios|fxios/i.test(ua);
    if (ios) {
      setIsIOS(true);
      setVisible(true);
      return;
    }

    function onBeforeInstall(e: Event) {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      setVisible(true);
    }
    window.addEventListener('beforeinstallprompt', onBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', onBeforeInstall);
  }, []);

  // Auto-hide after a while so the prompt never lingers. This is a passive
  // timeout, not an explicit dismissal, so it does not persist the 7-day snooze
  // and may reappear on a later visit. The X button is what snoozes it.
  useEffect(() => {
    if (!visible) return;
    const t = setTimeout(() => setVisible(false), AUTO_HIDE_MS);
    return () => clearTimeout(t);
  }, [visible]);

  function dismiss() {
    setVisible(false);
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {
      // ignore storage failures
    }
  }

  async function install() {
    if (!deferred) return;
    await deferred.prompt();
    await deferred.userChoice;
    setDeferred(null);
    dismiss();
  }

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Install ShieldPay"
      className="fixed inset-x-3 z-[60] flex items-start gap-3 rounded-xl border border-slate-700 bg-slate-900 p-3 shadow-[0_16px_48px_-16px_rgba(0,0,0,0.75)] md:hidden"
      style={{ bottom: 'calc(56px + env(safe-area-inset-bottom) + 0.75rem)' }}
    >
      {/* The actual app icon (same asset as the favicon and the installed
          home-screen icon), so the prompt previews what gets installed. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/icon.svg" alt="" width={40} height={40} className="size-10 shrink-0 rounded-lg" />
      <div className="min-w-0 flex-1">
        <p className="font-headline text-sm text-slate-100">Install ShieldPay</p>
        {isIOS ? (
          <p className="mt-0.5 text-xs leading-relaxed text-slate-400">
            Tap <Share size={12} className="inline align-[-1px] text-slate-300" /> Share, then Add to
            Home Screen.
          </p>
        ) : (
          <p className="mt-0.5 text-xs leading-relaxed text-slate-400">
            Add it to your home screen for a fullscreen, app-like experience.
          </p>
        )}
        {!isIOS && (
          <button
            type="button"
            onClick={install}
            className="mt-2 inline-flex items-center gap-1.5 rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-indigo-500"
          >
            <Download size={14} /> Install
          </button>
        )}
      </div>
      <button
        type="button"
        aria-label="Dismiss"
        onClick={dismiss}
        className="grid size-7 shrink-0 place-items-center rounded-md text-slate-500 transition-colors hover:bg-slate-800 hover:text-slate-300"
      >
        <X size={16} />
      </button>
    </div>
  );
}
