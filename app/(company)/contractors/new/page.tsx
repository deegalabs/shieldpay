import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { InviteForm } from '@/components/invite-form';

export default function NewContractorPage() {
  return (
    <div className="mx-auto max-w-xl space-y-8">
      <div className="space-y-4">
        <Link
          href="/contractors"
          className="inline-flex items-center gap-1 text-sm text-fg-subtle hover:text-fg-default"
        >
          <ArrowLeft size={14} /> Back to contributors
        </Link>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-fg-default">Invite a contributor</h1>
          <p className="text-sm text-fg-subtle">
            Set their name and agreed range. They accept the invite, connect their own wallet, and
            confirm their identity. You never handle their keys.
          </p>
        </div>
      </div>
      <Card className="p-6">
        <InviteForm />
      </Card>
    </div>
  );
}
