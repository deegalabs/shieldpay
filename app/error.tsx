'use client';

import { useEffect } from 'react';
import { ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';

/** Root error boundary: a calm, on-brand fallback that never leaks internals. */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-6 text-center">
      <span className="mb-4 grid h-12 w-12 place-items-center rounded-xl bg-danger/15 text-danger">
        <ShieldAlert size={24} />
      </span>
      <h1 className="text-2xl font-bold tracking-tight">Something went wrong</h1>
      <p className="mt-2 text-sm text-muted">
        An unexpected error occurred. You can try again, and if it persists, head back home.
      </p>
      <div className="mt-6 flex gap-2">
        <Button onClick={reset}>Try again</Button>
        <Button asChild variant="ghost">
          <a href="/">Back to home</a>
        </Button>
      </div>
    </div>
  );
}
