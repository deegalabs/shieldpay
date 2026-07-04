import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

/**
 * A single back affordance for detail/sub pages. The app hierarchy is shallow
 * (list -> detail), so this replaces breadcrumbs: one clear "return" link,
 * visible on both desktop and mobile. On mobile the bottom tab bar covers the
 * primary destinations but not "back to where I came from", which is what this
 * gives. Keep the label short (the parent's name), e.g. "Contributors".
 */
export function BackLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1.5 text-sm text-fg-subtle transition-colors hover:text-fg-default"
    >
      <ArrowLeft size={15} /> {label}
    </Link>
  );
}
