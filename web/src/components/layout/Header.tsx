import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ConnectionStatusBadge } from './ConnectionStatus';
import { BrandMark } from './BrandMark';
import { useAuth } from '@/context/AuthContext';
interface HeaderProps {
  showNav?: boolean;
}

/** Inline gear icon for setup navigation.
 *
 * @param className - Optional Tailwind size and color classes.
 * @returns SVG gear icon element.
 */
function GearIcon({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 010 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 010-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28z"
      />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

/** Tailwind classes for primary navigation links.
 *
 * @param active - Whether the link matches the current route.
 * @returns Combined class string for the nav item.
 */
function navLinkClass(active: boolean) {
  return `block px-3 py-2 rounded-md text-sm transition-colors ${
    active
      ? 'text-white bg-slate-700/60'
      : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
  }`;
}

/** Tailwind classes for the setup gear link.
 *
 * @param active - Whether the setup route is active.
 * @returns Combined class string for the setup icon link.
 */
function setupLinkClass(active: boolean) {
  return `inline-flex items-center justify-center text-slate-300 hover:text-white transition-colors ${
    active ? 'text-white' : ''
  }`;
}

/** App header with brand, navigation, and Businessmap connection status.
 *
 * @param props - {@link HeaderProps}
 * @returns React element.
 */
export function Header({ showNav = true }: HeaderProps) {
  const { workspace, connectionStatus } = useAuth();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const setupActive = location.pathname.startsWith('/setup');
  const roomActive = location.pathname.startsWith('/room');

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-12 bg-bm-navy border-b border-slate-700">
      <div className="h-full flex items-center justify-between px-4">
        <div className="flex items-center gap-3 min-w-0">
          <Link to="/" className="flex items-center gap-2 group shrink-0">
            <BrandMark logoUrl={workspace.companyLogoUrl} />
            <span className="text-white font-semibold text-sm tracking-tight group-hover:text-slate-200 transition-colors hidden sm:inline">
              BM Planning
            </span>
          </Link>

          {showNav && (
            <nav className="hidden md:flex items-center gap-1 text-sm ml-2">
              <Link to="/room/demo" className={navLinkClass(roomActive)}>
                Voting room
              </Link>
            </nav>
          )}
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <ConnectionStatusBadge status={connectionStatus} subdomain={workspace.subdomain} />

          {showNav && (
            <Link
              to="/setup"
              className={`inline-flex ${setupLinkClass(setupActive)}`}
              aria-label="Setup"
              title="Setup"
              onClick={() => setMenuOpen(false)}
            >
              <GearIcon />
            </Link>
          )}

          {showNav && (
            <button
              type="button"
              className="md:hidden p-2 rounded-md text-slate-300 hover:text-white hover:bg-slate-700/50"
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((open) => !open)}
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                {menuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          )}
        </div>
      </div>

      {showNav && menuOpen && (
        <nav
          className="md:hidden border-t border-slate-700 bg-bm-navy px-2 py-2 space-y-0.5"
          aria-label="Mobile navigation"
        >
          <Link
            to="/room/demo"
            className={navLinkClass(roomActive)}
            onClick={() => setMenuOpen(false)}
          >
            Voting room
          </Link>
        </nav>
      )}
    </header>
  );
}
