'use client';

import * as React from 'react';
import * as TabsPrimitive from '@radix-ui/react-tabs';
import { cn } from '@/lib/utils';

/**
 * Tabs for an entity's detail view (e.g. a contributor: Details / Payments /
 * Proof of income). Keeps one URL and focuses each task instead of stacking
 * everything on a long scroll. Mono uppercase labels with an active indigo
 * underline, matching the app's nav rhythm; the list scrolls on narrow screens.
 */
export const Tabs = TabsPrimitive.Root;

export const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn('flex gap-1 overflow-x-auto border-b border-border', className)}
    {...props}
  />
));
TabsList.displayName = TabsPrimitive.List.displayName;

export const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      '-mb-px shrink-0 whitespace-nowrap border-b-2 border-transparent px-4 py-2.5',
      'font-mono text-xs uppercase tracking-wider text-fg-subtle transition-colors',
      'hover:text-fg-default focus-visible:outline-none focus-visible:text-fg-default',
      'data-[state=active]:border-brand data-[state=active]:text-fg-strong',
      className,
    )}
    {...props}
  />
));
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName;

export const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      'mt-6 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40',
      className,
    )}
    {...props}
  />
));
TabsContent.displayName = TabsPrimitive.Content.displayName;
