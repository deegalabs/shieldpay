import Link from 'next/link';
import { UserPlus, ShieldCheck, AlertCircle } from 'lucide-react';
import { getSession } from '@/lib/auth/server';
import { getCompanyByOwner, listContractors, type ContractorRow } from '@/lib/db/client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { truncateKey } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function ContractorsPage() {
  let contractors: ContractorRow[] = [];
  try {
    const session = await getSession();
    const company = session ? await getCompanyByOwner(session.sub) : null;
    if (company) contractors = await listContractors(company.id);
  } catch {
    /* DB unreachable */
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Contractors</h1>
          <p className="text-sm text-muted">People you pay, with their agreed contractual range.</p>
        </div>
        <Button asChild>
          <Link href="/contractors/new">
            <UserPlus size={16} /> Add contractor
          </Link>
        </Button>
      </div>

      {contractors.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="font-medium">No contractors yet</p>
          <p className="mt-1 text-sm text-muted">Add your first contractor to start paying with proof.</p>
          <Button asChild className="mt-4">
            <Link href="/contractors/new">
              <UserPlus size={16} /> Add contractor
            </Link>
          </Button>
        </Card>
      ) : (
        <Card className="divide-y divide-border overflow-hidden">
          {contractors.map((c) => (
            <Link
              key={c.id}
              href={`/contractors/${c.id}`}
              className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 transition hover:bg-surface-2/40"
            >
              <div className="min-w-[10rem]">
                <p className="font-medium">{c.name}</p>
                <p className="font-mono text-xs text-muted">{truncateKey(c.stellar_address, 6, 4)}</p>
              </div>
              <span className="text-sm text-muted">
                ${c.range_min / 100}–${c.range_max / 100} USDC/mo
              </span>
              {c.anchored ? (
                <Badge variant="success">
                  <ShieldCheck size={12} /> Identity anchored
                </Badge>
              ) : (
                <Badge variant="warning">
                  <AlertCircle size={12} /> Not anchored
                </Badge>
              )}
            </Link>
          ))}
        </Card>
      )}
    </div>
  );
}
