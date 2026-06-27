import Link from 'next/link';
import { UserPlus, ShieldCheck, AlertCircle, Clock } from 'lucide-react';
import { getSession } from '@/lib/auth/server';
import { getCompanyByOwner, listContractors, type ContractorRow } from '@/lib/db/client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { InviteLinkButton } from '@/components/invite-link-button';
import { truncateKey, usdRange } from '@/lib/utils';

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
          <h1 className="text-2xl font-bold">Collaborators</h1>
          <p className="text-sm text-muted">Invite, track status, and set each one&apos;s agreed range.</p>
        </div>
        <Button asChild>
          <Link href="/contractors/new">
            <UserPlus size={16} /> Invite collaborator
          </Link>
        </Button>
      </div>

      {contractors.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="font-medium">No collaborators yet</p>
          <p className="mt-1 text-sm text-muted">Invite your first collaborator to start paying with proof.</p>
          <Button asChild className="mt-4">
            <Link href="/contractors/new">
              <UserPlus size={16} /> Invite collaborator
            </Link>
          </Button>
        </Card>
      ) : (
        <Card className="divide-y divide-border overflow-hidden">
          {contractors.map((c) => {
            const invited = c.status === 'invited';
            return (
              <div key={c.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
                {invited ? (
                  <div className="min-w-[10rem]">
                    <p className="font-medium">{c.name}</p>
                    <p className="text-xs text-muted">{c.email || 'pending acceptance'}</p>
                  </div>
                ) : (
                  <Link href={`/contractors/${c.id}`} className="min-w-[10rem] hover:underline">
                    <p className="font-medium">{c.name}</p>
                    <p className="font-mono text-xs text-muted">
                      {c.stellar_address ? truncateKey(c.stellar_address, 6, 4) : '-'}
                    </p>
                  </Link>
                )}
                <span className="figure text-sm text-muted">
                  {usdRange(c.range_min, c.range_max)} USDC/mo
                </span>
                {invited ? (
                  <Badge variant="warning"><Clock size={12} /> Invited</Badge>
                ) : c.anchored ? (
                  <Badge variant="success"><ShieldCheck size={12} /> Anchored</Badge>
                ) : (
                  <Badge variant="brand"><AlertCircle size={12} /> Active</Badge>
                )}
                {invited ? (
                  <InviteLinkButton id={c.id} />
                ) : (
                  <Link href={`/contractors/${c.id}`} className="text-sm text-accent hover:underline">
                    Details
                  </Link>
                )}
              </div>
            );
          })}
        </Card>
      )}
    </div>
  );
}
