'use client';

import type { ReactNode } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

/**
 * Splits a contributor's detail into focused tabs instead of one long scroll.
 * The page header (name, anchor, Edit) stays above this; the sections are
 * server-rendered and passed in as nodes. Proof of income only exists once the
 * contributor has a wallet, so that tab is conditional.
 */
export function ContractorDetailTabs({
  details,
  payments,
  proof,
}: {
  details: ReactNode;
  payments: ReactNode;
  proof: ReactNode | null;
}) {
  return (
    <Tabs defaultValue="details">
      <TabsList>
        <TabsTrigger value="details">Details</TabsTrigger>
        <TabsTrigger value="payments">Payments</TabsTrigger>
        {proof && <TabsTrigger value="proof">Proof of income</TabsTrigger>}
      </TabsList>
      <TabsContent value="details">{details}</TabsContent>
      <TabsContent value="payments">{payments}</TabsContent>
      {proof && <TabsContent value="proof">{proof}</TabsContent>}
    </Tabs>
  );
}
