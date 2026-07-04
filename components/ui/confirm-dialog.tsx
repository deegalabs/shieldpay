'use client';

import * as React from 'react';
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
          <DialogContent title={options.title} description={options.description}>
            <div className="mt-6 flex justify-end gap-2">
              <Button variant="outline" onClick={() => settle(false)}>
                {options.cancelLabel ?? 'Cancel'}
              </Button>
              <Button
                variant={options.destructive ? 'danger' : 'primary'}
                onClick={() => settle(true)}
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
