import type { ConnectionStatus } from '@/types/planning';

interface ConnectionStatusProps {
  status: ConnectionStatus;
  subdomain?: string;
}

const STATUS_CONFIG: Record<
  ConnectionStatus,
  { label: string; dot: string; text: string; tooltip: string }
> = {
  connected: {
    label: 'Connected',
    dot: 'bg-emerald-400',
    text: 'text-emerald-100',
    tooltip:
      'Connected to Businessmap. Your API key (profile) and subdomain (workspace) are saved in this browser only.',
  },
  connecting: {
    label: 'Connecting…',
    dot: 'bg-amber-400 animate-pulse',
    text: 'text-amber-100',
    tooltip: 'Verifying your Businessmap API key and subdomain from this browser.',
  },
  disconnected: {
    label: 'Disconnected',
    dot: 'bg-slate-400',
    text: 'text-slate-300',
    tooltip:
      'Not connected to Businessmap. Add your API key in Your profile and subdomain in Workspace configuration.',
  },
  error: {
    label: 'Connection error',
    dot: 'bg-red-400',
    text: 'text-red-100',
    tooltip:
      'Could not reach Businessmap. Check your API key and subdomain in Setup, or your network / CORS policy.',
  },
};

/** Businessmap connection indicator with tooltip and optional subdomain label.
 *
 * @param props - {@link ConnectionStatusProps}
 * @returns React element.
 */
export function ConnectionStatusBadge({ status, subdomain }: ConnectionStatusProps) {
  const cfg = STATUS_CONFIG[status];

  return (
    <div className="flex items-center gap-3 text-sm">
      {subdomain && (
        <span className="text-slate-400 hidden sm:inline">
          {subdomain}.businessmap.io
        </span>
      )}
      <div
        tabIndex={0}
        className={`group relative flex items-center gap-2 cursor-help outline-none focus-visible:ring-2 focus-visible:ring-slate-400/50 rounded-sm ${cfg.text}`}
        title={cfg.tooltip}
        aria-label={`${cfg.label}. ${cfg.tooltip}`}
        role="status"
      >
        <span className={`h-2 w-2 rounded-full shrink-0 ${cfg.dot}`} aria-hidden />
        <span className="underline decoration-dotted decoration-slate-500/60 underline-offset-2">
          {cfg.label}
        </span>

        <span
          role="tooltip"
          className="pointer-events-none absolute top-full right-0 mt-2 w-64 rounded-md bg-slate-900 text-white text-xs leading-relaxed px-3 py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible group-focus-within:opacity-100 group-focus-within:visible transition-opacity shadow-lg z-[60]"
        >
          {cfg.tooltip}
        </span>
      </div>
    </div>
  );
}
