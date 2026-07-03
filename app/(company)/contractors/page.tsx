import type { ReactNode } from 'react';
import Link from 'next/link';
import { UserPlus, Users } from 'lucide-react';
import { getSession } from '@/lib/auth/server';
import { getCompanyByOwner, listContractors, type ContractorRow } from '@/lib/db/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ConnectionError } from '@/components/ui/connection-error';
import { DataTable, type Column } from '@/components/ui/data-table';
import { SealedChip } from '@/components/ui/sealed-chip';
import { OnChainSeal } from '@/components/ui/on-chain-seal';
import { InviteLinkButton } from '@/components/invite-link-button';
import { truncateKey } from '@/lib/utils';

export const dynamic = 'force-dynamic';

/** A quiet mono pill for a non-sealed status (Pending). */
function StatusTag({ children }: { children: ReactNode }) {
  return (
    <span className="mono inline-flex items-center rounded border border-border px-2 py-0.5 text-[10px] uppercase tracking-widest text-fg-subtle">
      {children}
    </span>
  );
}

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

  const anchored = contractors.filter((c) => c.anchored).length;

  const columns: Array<Column<ContractorRow>> = [
    {
      key: 'name',
      header: 'Contributor',
      cell: (c) => {
        const invited = c.status === 'invited';
        return (
          <div className="flex items-center gap-3">
            <span
              aria-hidden
              className="grid size-8 shrink-0 place-items-center rounded bg-surface-3 font-headline text-sm text-fg-subtle"
            >
              {c.name.charAt(0).toUpperCase()}
            </span>
            <div className="min-w-0">
              <div className="truncate font-medium text-fg-strong">{c.name}</div>
              {invited ? (
                <div className="mono text-[10px] text-fg-faint">{c.email || 'Pending acceptance'}</div>
              ) : (
                <div className="mono text-[10px] text-fg-faint">
                  {c.stellar_address ? truncateKey(c.stellar_address, 6, 4) : '-'}
                </div>
              )}
            </div>
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
      align: 'right',
      cell: (c) => (
        <span className="flex justify-end">
          <SealedChip range={{ minCents: c.range_min, maxCents: c.range_max }} />
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      className: 'text-center',
      headerClassName: 'text-center',
      cell: (c) =>
        c.status === 'invited' ? (
          <StatusTag>Pending</StatusTag>
        ) : (
          <OnChainSeal
            state={c.anchored ? 'verified' : 'computing'}
            label={c.anchored ? 'Anchored' : 'Not anchored'}
            className="justify-center"
          />
        ),
    },
    {
      key: 'action',
      header: <span className="sr-only">Actions</span>,
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
    <div className="space-y-10">
      <header className="flex flex-col gap-6 border-b border-border pb-6 md:flex-row md:items-end md:justify-between">
        <div className="space-y-3">
          <p className="overline">Recipients</p>
          <h1 className="font-headline text-headline-lg-mobile tracking-tight text-fg-default md:text-headline-lg">
            Contributors
          </h1>
          <div className="flex items-end gap-6">
            <div>
              <div className="overline mb-1.5">Total recipients</div>
              <div className="figure text-lg text-fg-default">{contractors.length}</div>
            </div>
            <span aria-hidden className="h-8 w-px self-center bg-border" />
            <div>
              <div className="overline mb-1.5">Anchored</div>
              <div className="figure text-lg text-verified-text">{anchored}</div>
            </div>
          </div>
        </div>
        <Button asChild className="shrink-0">
          <Link href="/contractors/new">
            <UserPlus size={16} /> Invite contributor
          </Link>
        </Button>
      </header>

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
            indexRail
            rowHref={(c) => (c.status === 'invited' ? undefined : `/contractors/${c.id}`)}
            rowLabel={(c) => `Open ${c.name}`}
            caption="Contributors, their agreed range and status."
          />
        </Card>
      )}
    </div>
  );
}
