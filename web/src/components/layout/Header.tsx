import { Link } from 'react-router-dom';
import { ConnectionStatusBadge } from './ConnectionStatus';
import { useAuth } from '@/context/AuthContext';

interface HeaderProps {
  showNav?: boolean;
}

export function Header({ showNav = true }: HeaderProps) {
  const { config, connectionStatus } = useAuth();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-12 bg-bm-navy border-b border-slate-700 flex items-center justify-between px-4">
      <div className="flex items-center gap-6">
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="h-7 w-7 rounded-md bg-bm-blue flex items-center justify-center text-white text-xs font-bold">
            BM
          </div>
          <span className="text-white font-semibold text-sm tracking-tight group-hover:text-slate-200 transition-colors">
            BM Planning
          </span>
        </Link>
        {showNav && (
          <nav className="hidden md:flex items-center gap-1 text-sm">
            <Link
              to="/setup"
              className="px-3 py-1.5 rounded-md text-slate-300 hover:text-white hover:bg-slate-700/50 transition-colors"
            >
              Configuração
            </Link>
            <Link
              to="/room/demo"
              className="px-3 py-1.5 rounded-md text-slate-300 hover:text-white hover:bg-slate-700/50 transition-colors"
            >
              Sala de Votação
            </Link>
          </nav>
        )}
      </div>
      <ConnectionStatusBadge status={connectionStatus} subdomain={config?.subdomain} />
    </header>
  );
}
