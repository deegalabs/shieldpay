import { KeyRound } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { BackLink } from '@/components/ui/back-link';
import { SealedChip } from '@/components/ui/sealed-chip';
import { InviteForm } from '@/components/invite-form';

// The InviteForm renders both a desktop layout (md+, inside its own Card) and a
// distinct mobile layout (below md, the approved Stitch print) from a single
// shared form instance. This page provides the desktop-only page chrome
// (back link, header, explainer aside) and hides it below md.

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
    <div className="mx-auto flex max-w-6xl flex-col gap-8">
      <BackLink href="/contractors" label="Contributors" />

      <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12">
        {/* Form column: header is desktop-only; the form carries its own mobile heading. */}
        <div className="flex flex-col gap-8 lg:col-span-7">
          <header className="hidden space-y-3 md:block">
            <p className="overline">New recipient</p>
            <h1 className="font-headline text-headline-lg-mobile tracking-tight text-fg-default md:text-headline-lg">
              Invite a contributor
            </h1>
            <p className="max-w-xl text-sm text-fg-subtle">
              Set their name and agreed range. They accept the invite, connect their own wallet, and
              confirm their identity. You never handle their keys.
            </p>
          </header>
          <InviteForm />
        </div>

        {/* Explainer column: desktop-only. */}
        <aside className="hidden md:block lg:col-span-5">
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
