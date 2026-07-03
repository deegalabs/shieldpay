import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { InviteForm } from '@/components/invite-form';

export default function NewContractorPage() {
  return (
    <div className="mx-auto max-w-xl">
      <Link href="/contractors" className="mb-4 inline-flex items-center gap-1 text-sm text-muted hover:text-foreground">
        <ArrowLeft size={14} /> Back to contributors
      </Link>
      <h1 className="text-2xl font-bold">Invite a contributor</h1>
      <p className="mt-1 text-sm text-muted">
        Set their name and agreed range. They accept the invite, connect their own wallet, and
        confirm their identity, you never handle their keys.
      </p>
      <Card className="mt-6 p-6">
        <InviteForm />
      </Card>
    </div>
  );
}
