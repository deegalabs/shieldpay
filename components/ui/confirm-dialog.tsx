'use client';

import * as React from 'react';
import { AlertTriangle, ShieldQuestion } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

/**
 * App-wide confirmation modal. Replaces the browser's native confirm() (which
 * breaks the dark finance surface) with a themed Dialog. Mount <ConfirmProvider>
 * once near the root; then in any client component:
 *
 *   const confirm = useConfirm();
 *   if (await confirm({ title: 'Remove contributor', destructive: true })) { ... }
 *
 * Returns a promise that resolves true on confirm, false on cancel/dismiss.
 */
export interface ConfirmOptions {
  title: string;
  description?: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
}

type ConfirmFn = (options: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = React.createContext<ConfirmFn>(() => Promise.resolve(false));

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false);
  const [options, setOptions] = React.useState<ConfirmOptions | null>(null);
  const resolver = React.useRef<((value: boolean) => void) | null>(null);

  const settle = React.useCallback((result: boolean) => {
    setOpen(false);
    resolver.current?.(result);
    resolver.current = null;
  }, []);

  const confirm = React.useCallback<ConfirmFn>((opts) => {
    setOptions(opts);
    setOpen(true);
    return new Promise<boolean>((resolve) => {
      resolver.current = resolve;
    });
  }, []);

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <Dialog
        open={open}
        onOpenChange={(next) => {
          // Closing via overlay/Escape/X counts as cancel.
          if (!next) settle(false);
        }}
      >
        {options && (
          <DialogContent
            title={options.title}
            description={options.description}
            icon={
              options.destructive ? (
                <span className="grid size-10 place-items-center rounded-full border border-danger/30 bg-danger/10 text-danger-text shadow-[0_0_20px_-8px_hsl(var(--danger)/0.6)]">
                  <AlertTriangle size={18} strokeWidth={2} aria-hidden />
                </span>
              ) : (
                <span className="grid size-10 place-items-center rounded-full border border-brand/30 bg-brand/10 text-brand-text">
                  <ShieldQuestion size={18} strokeWidth={2} aria-hidden />
                </span>
              )
            }
          >
            <div className="mt-7 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button variant="outline" onClick={() => settle(false)} className="sm:min-w-24">
                {options.cancelLabel ?? 'Cancel'}
              </Button>
              <Button
                variant={options.destructive ? 'danger' : 'primary'}
                onClick={() => settle(true)}
                className="sm:min-w-24"
              >
                {options.confirmLabel ?? 'Confirm'}
              </Button>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </ConfirmContext.Provider>
  );
}

export function useConfirm(): ConfirmFn {
  return React.useContext(ConfirmContext);
}
