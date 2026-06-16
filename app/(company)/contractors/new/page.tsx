import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { ContractorForm } from '@/components/contractor-form';

export default function NewContractorPage() {
  return (
    <div className="mx-auto max-w-xl">
      <Link href="/contractors" className="mb-4 inline-flex items-center gap-1 text-sm text-muted hover:text-foreground">
        <ArrowLeft size={14} /> Back to contractors
      </Link>
      <h1 className="text-2xl font-bold">Add contractor</h1>
      <p className="mt-1 text-sm text-muted">Their CPF is stored only as a hash, never in plaintext.</p>
      <Card className="mt-6 p-6">
        <ContractorForm submitLabel="Add contractor" />
      </Card>
    </div>
  );
}
