'use client';

import * as React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Sheet: a side drawer for short, in-context tasks launched from a list or
 * detail view (edit a contributor, quick create) where the background context
 * should stay visible. Built on Radix Dialog for focus trap, Escape, scroll
 * lock and a11y. Right-hand drawer on md+, bottom sheet on phones. See the
 * modal/drawer guidance: full pages stay pages, this is only for secondary
 * tasks you return from.
 */
export const Sheet = DialogPrimitive.Root;
export const SheetTrigger = DialogPrimitive.Trigger;
export const SheetClose = DialogPrimitive.Close;

export const SheetContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & {
    title?: React.ReactNode;
    description?: React.ReactNode;
  }
>(({ className, children, title, description, ...props }, ref) => (
  <DialogPrimitive.Portal>
    <DialogPrimitive.Overlay className="sp-overlay-in fixed inset-0 z-[100] bg-slate-950/70 backdrop-blur-sm" />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        'sp-sheet-in fixed z-[101] flex flex-col bg-surface text-fg-default shadow-2xl focus:outline-none',
        // Phones: bottom sheet.
        'inset-x-0 bottom-0 max-h-[90vh] rounded-t-2xl border-t border-border',
        // md+: right-hand drawer, full height.
        'md:inset-y-0 md:left-auto md:right-0 md:bottom-auto md:h-full md:max-h-none md:w-[440px] md:max-w-[92vw] md:rounded-none md:border-l md:border-t-0',
        className,
      )}
      {...props}
    >
      <div className="flex items-start justify-between gap-4 border-b border-border px-6 py-4">
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
        <DialogPrimitive.Close
          aria-label="Close"
          className="grid size-8 shrink-0 place-items-center rounded-md text-fg-subtle transition-colors hover:bg-surface-2 hover:text-fg-default focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
        >
          <X size={18} />
        </DialogPrimitive.Close>
      </div>
      <div className="flex-1 overflow-y-auto px-6 py-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
        {children}
      </div>
    </DialogPrimitive.Content>
  </DialogPrimitive.Portal>
));
SheetContent.displayName = 'SheetContent';
