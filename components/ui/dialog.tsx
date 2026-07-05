'use client';

import * as React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Dialog: a centered modal for short confirmations and previews (revoke a link,
 * remove a record, preview a receipt). Not for primary destinations or the
 * money-moving payroll flow, those stay full pages. Built on Radix Dialog.
 */
export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogClose = DialogPrimitive.Close;

export const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & {
    title?: React.ReactNode;
    description?: React.ReactNode;
    /** Optional leading badge (e.g. a warning glyph on a destructive confirm). */
    icon?: React.ReactNode;
  }
>(({ className, children, title, description, icon, ...props }, ref) => (
  <DialogPrimitive.Portal>
    <DialogPrimitive.Overlay className="sp-overlay-in fixed inset-0 z-[100] bg-slate-950/70 backdrop-blur-sm" />
    <div className="fixed inset-0 z-[101] grid place-items-center p-4">
      <DialogPrimitive.Content
        ref={ref}
        className={cn(
          // Elevated modal surface per the design system: overlay-level lightness,
          // a 1px top-edge highlight, and the single drop shadow reserved for the
          // overlay layer (no shadow elsewhere in the app).
          'sp-dialog-in top-edge relative flex w-full max-w-md flex-col rounded-2xl border border-border bg-surface-overlay text-fg-default shadow-overlay focus:outline-none',
          className,
        )}
        {...props}
      >
        <div className="flex items-start justify-between gap-4 px-6 pt-5">
          <div className="flex min-w-0 items-start gap-3.5">
            {icon != null && <span className="mt-0.5 shrink-0">{icon}</span>}
            <div className="min-w-0">
              {title != null && (
                <DialogPrimitive.Title className="font-headline text-lg tracking-tight text-fg-default">
                  {title}
                </DialogPrimitive.Title>
              )}
              {description != null && (
                <DialogPrimitive.Description className="mt-1 text-sm text-fg-subtle">
                  {description}
                </DialogPrimitive.Description>
              )}
            </div>
          </div>
          <DialogPrimitive.Close
            aria-label="Close"
            className="grid size-8 shrink-0 place-items-center rounded-md text-fg-subtle transition-colors hover:bg-surface-2 hover:text-fg-default focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
          >
            <X size={18} />
          </DialogPrimitive.Close>
        </div>
        <div className="px-6 py-5">{children}</div>
      </DialogPrimitive.Content>
    </div>
  </DialogPrimitive.Portal>
));
DialogContent.displayName = 'DialogContent';
