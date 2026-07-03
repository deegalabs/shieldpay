import Link from 'next/link';
import { ArrowLeft, KeyRound } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { SealedChip } from '@/components/ui/sealed-chip';
import { InviteForm } from '@/components/invite-form';

export const dynamic = 'force-dynamic';

/** One node of the vertical onboarding stepper. */
function Step({ label, active }: { label: string; active?: boolean }) {
  return (
    <div className="relative z-10 flex items-center gap-4">
      <span
        className={`grid size-6 shrink-0 place-items-center rounded-full border-2 bg-surface ${
          active ? 'border-brand' : 'border-border'
        }`}
      >
        {active && <span aria-hidden className="size-2 rounded-full bg-brand" />}
      </span>
      <span className={`mono text-sm ${active ? 'text-fg-default' : 'text-fg-subtle'}`}>{label}</span>
    </div>
  );
}

export default function NewContractorPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <Link
        href="/contractors"
        className="inline-flex items-center gap-1 text-sm text-fg-subtle hover:text-fg-default"
      >
        <ArrowLeft size={14} /> Back to contributors
      </Link>

      <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12">
        {/* Form column */}
        <div className="space-y-8 lg:col-span-7">
          <header className="space-y-3">
            <p className="overline">New recipient</p>
            <h1 className="font-headline text-headline-lg-mobile tracking-tight text-fg-default md:text-headline-lg">
              Invite a contributor
            </h1>
            <p className="max-w-xl text-sm text-fg-subtle">
              Set their name and agreed range. They accept the invite, connect their own wallet, and
              confirm their identity. You never handle their keys.
            </p>
          </header>
          <Card className="p-6">
            <InviteForm />
          </Card>
        </div>

        {/* Explainer column */}
        <aside className="lg:col-span-5">
          <Card className="top-edge space-y-8 p-6 lg:sticky lg:top-8">
            <div className="space-y-3">
              <p className="overline text-brand-text">Privacy by default</p>
              <p className="text-sm leading-relaxed text-fg-subtle">
                The agreed range is public; the exact amount you pay stays sealed. Every payment is
                proven on-chain without revealing the figure.
              </p>
              <div className="pt-1">
                <SealedChip label="$450 - $550 / mo" size="md" />
              </div>
            </div>

            <div className="space-y-4 border-t border-border pt-6">
              <p className="overline">Onboarding</p>
              {/* Vertical stepper motif: indigo -> surface gradient line. */}
              <div className="relative flex flex-col gap-7 before:absolute before:bottom-3 before:left-[11px] before:top-3 before:w-0.5 before:bg-gradient-to-b before:from-brand before:to-surface-3">
                <Step label="Accept invite" active />
                <Step label="Provide details" />
                <Step label="Anchor on-chain" />
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-lg border-l-2 border-verified bg-surface-2 p-4">
              <KeyRound size={16} className="mt-0.5 shrink-0 text-verified-text" />
              <p className="text-sm text-fg-subtle">
                You never handle their keys. The ID and wallet are provided by the contributor when
                they accept, and they anchor their own identity.
              </p>
            </div>
          </Card>
        </aside>
      </div>
    </div>
  );
}
