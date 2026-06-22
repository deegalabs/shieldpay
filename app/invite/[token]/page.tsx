import { ShieldCheck, Lock } from 'lucide-react';
import { verifyScopedToken } from '@/lib/auth/session';
import { USDC } from '@/lib/constants';
import { getInvite } from '@/lib/db/client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { InviteAccept } from '@/components/invite-accept';

export const dynamic = 'force-dynamic';

export default async function InvitePage({ params }: { params: { token: string } }) {
  const claims = await verifyScopedToken<{ scope: string; cid: string }>(params.token);

  let invite = null;
  if (claims?.scope === 'invite') {
    try {
      invite = await getInvite(claims.cid);
    } catch {
      /* DB unreachable */
    }
  }

  const invalid = !claims || claims.scope !== 'invite' || !invite;
  const alreadyAccepted = invite && invite.status !== 'invited';

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-12">
      <div className="mb-6 text-center">
        <span className="mx-auto mb-4 grid h-11 w-11 place-items-center rounded-xl bg-brand/15 text-brand">
          <ShieldCheck size={22} />
        </span>
        <h1 className="text-2xl font-bold tracking-tight">You&apos;ve been invited</h1>
      </div>

      {invalid ? (
        <Card className="p-6 text-center">
          <span className="mx-auto mb-3 grid h-10 w-10 place-items-center rounded-full bg-warning/15 text-warning">
            <Lock size={18} />
          </span>
          <p className="font-medium">Invite invalid or expired</p>
          <p className="mt-1 text-sm text-muted">Ask the organization to send you a new link.</p>
        </Card>
      ) : alreadyAccepted ? (
        <Card className="p-6 text-center">
          <p className="font-medium text-primary">This invite was already accepted</p>
          <p className="mt-1 text-sm text-muted">
            Sign in to your portal to see your payments.
          </p>
          <a href="/login" className="mt-3 inline-block text-accent hover:underline">Go to my portal</a>
        </Card>
      ) : (
        <Card className="space-y-4 p-6">
          <div className="rounded-lg border border-border bg-surface-2/40 p-4 text-sm">
            <p>
              <span className="text-muted">Organization:</span>{' '}
              <span className="font-medium">{invite!.company_name}</span>
            </p>
            <p className="mt-1">
              <span className="text-muted">You:</span> <span className="font-medium">{invite!.name}</span>
            </p>
            {invite!.role && (
              <p className="mt-1">
                <span className="text-muted">Role:</span> {invite!.role}
              </p>
            )}
            <p className="mt-1 flex items-center gap-2">
              <span className="text-muted">Agreed range:</span>
              <Badge variant="brand">
                ${invite!.range_min / 100}-${invite!.range_max / 100} USDC/mo
              </Badge>
            </p>
          </div>
          <InviteAccept
            token={params.token}
            companyAddress={
              /^G[A-Z2-7]{55}$/.test(invite!.company_treasury || '')
                ? invite!.company_treasury!
                : process.env.COMPANY_PUBLIC_KEY || ''
            }
            anchorContractId={process.env.ANCHOR_REGISTRY_CONTRACT_ID || ''}
            defaultName={invite!.name}
            usdcCode={USDC.code}
            usdcIssuer={USDC.issuer}
          />
        </Card>
      )}
    </div>
  );
}
