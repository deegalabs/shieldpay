import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { BrandMark } from '@/components/ui/brand-mark';

/**
 * Minimal shell for the marketing legal pages (Terms, Privacy). A quiet header,
 * a readable prose column, and a back link. Not a substitute for legal counsel;
 * the copy is written to honestly describe a hackathon-stage product.
 */
export function LegalPage({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-border bg-background/70 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-3.5">
          <Link href="/" className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand/10">
              <BrandMark size={18} />
            </span>
            <span className="font-semibold tracking-tight">ShieldPay</span>
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-sm text-fg-subtle transition hover:text-foreground"
          >
            <ArrowLeft size={14} /> Back to home
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-14">
        <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
        <p className="mt-2 text-sm text-fg-faint">Last updated: {updated}</p>
        <div className="legal mt-8 space-y-6 text-sm leading-relaxed text-fg-strong">{children}</div>
      </main>

      <footer className="border-t border-border py-8 text-center text-sm text-fg-subtle">
        © 2026 ShieldPay · Built on Stellar + Zero-Knowledge
      </footer>
    </div>
  );
}

export function LegalSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2">
      <h2 className="text-base font-semibold text-foreground">{title}</h2>
      <div className="space-y-2 text-fg-subtle">{children}</div>
    </section>
  );
}
