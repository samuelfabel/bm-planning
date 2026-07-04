import type { ReactNode } from 'react';
import { Header } from './Header';

interface MainLayoutProps {
  children: ReactNode;
  showNav?: boolean;
}

/** Page shell with fixed header and main content area.
 *
 * @param props - {@link MainLayoutProps}
 * @returns React element.
 */
export function MainLayout({ children, showNav = true }: MainLayoutProps) {
  return (
    <div className="min-h-screen bg-bm-bg">
      <Header showNav={showNav} />
      <main className="pt-12 min-h-[calc(100vh-3rem)]">
        {children}
      </main>
    </div>
  );
}
