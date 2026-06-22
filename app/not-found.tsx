import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { BrandMark } from '@/components/ui/brand-mark';

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-6 text-center">
      <span className="mb-4 grid h-12 w-12 place-items-center rounded-xl bg-brand/10">
        <BrandMark size={26} />
      </span>
      <h1 className="text-3xl font-bold tracking-tight">Page not found</h1>
      <p className="mt-2 text-sm text-muted">
        The page you are looking for does not exist or may have moved.
      </p>
      <Button asChild className="mt-6">
        <Link href="/">Back to home</Link>
      </Button>
    </div>
  );
}
