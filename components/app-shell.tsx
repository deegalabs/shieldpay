import { AppSidebar } from '@/components/app-sidebar';

export interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
}

/**
 * The Executive Ledger app shell, reproduced 1:1 from the Stitch export
 * (temp/.../shieldpay_executive_ledger_dashboard/code.html): a fixed left
 * sidebar (company block + "New Payment" button + vertical nav + Security/
 * Support footer) beside a full-height main canvas. The interactive chrome
 * lives in AppSidebar (active-link state + mobile hamburger drawer); the
 * `<main>` wrapper carries the reference canvas (noise texture + scroll
 * container with the reference max-width/padding) so every page inherits the
 * same offset and rhythm. Public props are unchanged so the company and worker
 * layouts keep passing the same slots.
 */
export function AppShell({
  title,
  nav,
  actions,
  children,
}: {
  title: string;
  subtitle?: string;
  nav: NavItem[];
  user?: { name?: string; role?: string };
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-slate-900 text-slate-300">
      <AppSidebar title={title} nav={nav} actions={actions} />
      {/* Main Canvas */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-[#0a0f18] relative">
        {/* Noise texture overlay */}
        <div
          className="absolute inset-0 opacity-[0.02] pointer-events-none"
          style={{
            backgroundImage:
              "url('data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E')",
          }}
        ></div>
        <div className="flex-1 overflow-y-auto px-6 py-8 md:px-12 md:py-12 relative z-10 max-w-[1920px] mx-auto w-full flex flex-col gap-12">
          {children}
        </div>
      </main>
    </div>
  );
}
