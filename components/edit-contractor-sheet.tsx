'use client';

import { useState } from 'react';
import { Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetTrigger, SheetContent } from '@/components/ui/sheet';
import { ContractorForm, type ContractorDefaults } from '@/components/contractor-form';

/**
 * Edit a contributor from a side drawer instead of an inline form, so the CFO
 * keeps the recipient's context (range, anchor, history) visible behind it. The
 * form is unchanged: on save it reloads the detail route, which closes the
 * drawer. Bottom sheet on phones.
 */
export function EditContractorSheet({
  contractorId,
  defaults,
  redirectTo,
}: {
  contractorId: string;
  defaults: ContractorDefaults;
  redirectTo: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm">
          <Pencil size={14} /> Edit details
        </Button>
      </SheetTrigger>
      <SheetContent
        title="Edit details"
        description="Update the contributor's wallet and agreed range."
      >
        <ContractorForm
          contractorId={contractorId}
          defaults={defaults}
          submitLabel="Save changes"
          redirectTo={redirectTo}
        />
      </SheetContent>
    </Sheet>
  );
}
