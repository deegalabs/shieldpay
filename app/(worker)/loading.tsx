/** Skeleton shown while the worker portal streams in. */
export default function Loading() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading">
      <div className="h-8 w-48 animate-pulse rounded-lg bg-surface-2/40" />
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="h-32 animate-pulse rounded-xl border border-border bg-surface-2/40" />
        <div className="h-32 animate-pulse rounded-xl border border-border bg-surface-2/40" />
      </div>
      <div className="h-48 animate-pulse rounded-xl border border-border bg-surface-2/40" />
    </div>
  );
}
