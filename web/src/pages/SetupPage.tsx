import { MainLayout } from '@/components/layout/MainLayout';
import { BusinessmapProxyProvider, useBusinessmapProxy } from '@/context/BusinessmapProxyContext';
import { useApiCredentials } from '@/context/AuthContext';
import { PersonConfigSection } from '@/components/setup/PersonConfigSection';
import { WorkspaceConfigSection } from '@/components/setup/WorkspaceConfigSection';
import { CardQuerySection } from '@/components/setup/CardQuerySection';

export function SetupPage() {
  return (
    <MainLayout>
      <BusinessmapProxyProvider>
        <SetupPageContent />
      </BusinessmapProxyProvider>
    </MainLayout>
  );
}

/** Inline refresh icon for catalog reload actions.
 *
 * @param className - Optional Tailwind size and color classes.
 * @returns SVG refresh icon element.
 */
function RefreshIcon({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
      />
    </svg>
  );
}

/** Inner setup page that consumes BusinessmapProxyContext.
 *
 * @returns Setup sections for profile, workspace, and card queries.
 */
function SetupPageContent() {
  const { error: proxyError, reloadCatalog, loadingBoards, loadingCustomFields } =
    useBusinessmapProxy();
  const hasCredentials = Boolean(useApiCredentials());
  const isRefreshing = loadingBoards || loadingCustomFields;

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-bm-textDark">Planning Setup</h1>
        <p className="text-sm text-bm-textMuted mt-1">
          Configure your profile and workspace, then create a room. Deck and task selection happen
          when you create a room.
        </p>
      </div>

      {proxyError && hasCredentials && (
        <div className="mb-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-md border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
          <p className="min-w-0">{proxyError}</p>
          <button
            type="button"
            onClick={() => void reloadCatalog()}
            disabled={isRefreshing}
            aria-label={isRefreshing ? 'Refreshing Businessmap data' : 'Refresh Businessmap data'}
            title={isRefreshing ? 'Refreshing…' : 'Refresh'}
            className="shrink-0 self-start sm:self-center text-current opacity-80 hover:opacity-100 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
          >
            <RefreshIcon className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="space-y-5">
          <PersonConfigSection />
          <WorkspaceConfigSection />
        </div>
        <CardQuerySection />
      </div>
    </div>
  );
}
