import Link from 'next/link';
import { UserPlus, ShieldCheck, AlertCircle, Clock, Users } from 'lucide-react';
import { getSession } from '@/lib/auth/server';
import { getCompanyByOwner, listContractors, type ContractorRow } from '@/lib/db/client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ConnectionError } from '@/components/ui/connection-error';
import { DataTable, type Column } from '@/components/ui/data-table';
import { InviteLinkButton } from '@/components/invite-link-button';
import { truncateKey, usdRange } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function ContractorsPage() {
  let contractors: ContractorRow[] = [];
  let dbError = false;
  try {
    const session = await getSession();
    const company = session ? await getCompanyByOwner(session.sub) : null;
    if (company) contractors = await listContractors(company.id);
  } catch {
    dbError = true;
  }

  const columns: Array<Column<ContractorRow>> = [
    {
      key: 'name',
      header: 'Contributor',
      cell: (c) => {
        const invited = c.status === 'invited';
        return (
          <div className="min-w-[10rem]">
            <p className="font-medium text-fg-strong">{c.name}</p>
            {invited ? (
              <p className="text-xs text-fg-faint">{c.email || 'Pending acceptance'}</p>
            ) : (
              <p className="font-mono text-xs text-fg-subtle">
                {c.stellar_address ? truncateKey(c.stellar_address, 6, 4) : '-'}
              </p>
            )}
          </div>
        );
      },
    },
    {
      key: 'role',
      header: 'Role',
      cell: (c) => <span className="text-fg-subtle">{c.role || '-'}</span>,
    },
    {
      key: 'range',
      header: 'Agreed range',
      align: 'money',
      cell: (c) => `${usdRange(c.range_min, c.range_max)} / mo`,
    },
    {
      key: 'status',
      header: 'Status',
      align: 'right',
      cell: (c) =>
        c.status === 'invited' ? (
          <Badge variant="warning">
            <Clock size={12} /> Invited
          </Badge>
        ) : c.anchored ? (
          <Badge variant="success">
            <ShieldCheck size={12} /> Anchored
          </Badge>
        ) : (
          <Badge variant="brand">
            <AlertCircle size={12} /> Active
          </Badge>
        ),
    },
    {
      key: 'action',
      header: '',
      align: 'right',
      cell: (c) =>
        c.status === 'invited' ? (
          <span className="relative z-10 inline-flex justify-end">
            <InviteLinkButton id={c.id} />
          </span>
        ) : null,
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-fg-default">Contributors</h1>
          <p className="text-sm text-fg-subtle">
            Invite, track status, and set each one&apos;s agreed range.
          </p>
        </div>
        <Button asChild>
          <Link href="/contractors/new">
            <UserPlus size={16} /> Invite contributor
          </Link>
        </Button>
      </div>

      {dbError ? (
        <ConnectionError
          title="We cannot reach your contributors right now."
          message="Please try again in a moment."
        />
      ) : contractors.length === 0 ? (
        <Card className="flex flex-col items-center gap-3 p-8 text-center">
          <span
            aria-hidden
            className="grid size-10 place-items-center rounded-xl bg-surface-2 text-fg-subtle"
          >
            <Users size={20} strokeWidth={1.5} />
          </span>
          <div className="space-y-1">
            <p className="font-medium text-fg-strong">No contributors yet</p>
            <p className="text-sm text-fg-subtle">
              Invite your first contributor to start paying with proof.
            </p>
          </div>
          <Button asChild className="mt-1">
            <Link href="/contractors/new">
              <UserPlus size={16} /> Invite contributor
            </Link>
          </Button>
        </Card>
      ) : (
        <Card className="overflow-hidden p-0">
          <DataTable
            columns={columns}
            rows={contractors}
            rowKey={(c) => c.id}
            rowHref={(c) => (c.status === 'invited' ? undefined : `/contractors/${c.id}`)}
            rowLabel={(c) => `Open ${c.name}`}
            caption="Contributors, their agreed range and status."
          />
        </Card>
      )}
    </div>
  );
}
