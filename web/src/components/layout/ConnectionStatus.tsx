import type { ConnectionStatus } from '@/types/planning';

interface ConnectionStatusProps {
  status: ConnectionStatus;
  subdomain?: string;
}

const STATUS_CONFIG: Record<ConnectionStatus, { label: string; dot: string; text: string }> = {
  connected: { label: 'Conectado', dot: 'bg-emerald-400', text: 'text-emerald-100' },
  connecting: { label: 'Conectando…', dot: 'bg-amber-400 animate-pulse', text: 'text-amber-100' },
  disconnected: { label: 'Desconectado', dot: 'bg-slate-400', text: 'text-slate-300' },
  error: { label: 'Erro de conexão', dot: 'bg-red-400', text: 'text-red-100' },
};

export function ConnectionStatusBadge({ status, subdomain }: ConnectionStatusProps) {
  const cfg = STATUS_CONFIG[status];

  return (
    <div className="flex items-center gap-3 text-sm">
      {subdomain && (
        <span className="text-slate-400 hidden sm:inline">
          {subdomain}.businessmap.io
        </span>
      )}
      <div className={`flex items-center gap-2 ${cfg.text}`}>
        <span className={`h-2 w-2 rounded-full ${cfg.dot}`} />
        <span>{cfg.label}</span>
      </div>
    </div>
  );
}
