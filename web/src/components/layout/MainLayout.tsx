import type { ReactNode } from 'react';
import { Header } from './Header';

interface MainLayoutProps {
  children: ReactNode;
  showNav?: boolean;
}

export function MainLayout({ children, showNav = true }: MainLayoutProps) {
  return (
    <div className="min-h-screen bg-bm-bg">
      <Header showNav={showNav} />
      <main className="pt-12 min-h-screen">
        {children}
      </main>
    </div>
  );
}
