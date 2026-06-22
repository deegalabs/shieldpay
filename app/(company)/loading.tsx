/** Skeleton shown while a company page streams in. Calm, no spinner. */
export default function Loading() {
  return (
    <div className="space-y-8" aria-busy="true" aria-label="Loading">
      <div className="grid gap-4 sm:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-24 animate-pulse rounded-xl border border-border bg-surface-2/40" />
        ))}
      </div>
      <div className="h-10 w-64 animate-pulse rounded-lg bg-surface-2/40" />
      <div className="h-56 animate-pulse rounded-xl border border-border bg-surface-2/40" />
    </div>
  );
}
