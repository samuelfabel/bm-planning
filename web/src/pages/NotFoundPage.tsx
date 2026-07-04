import { Link } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';

/** Fallback route for unknown URLs with a link back home.
 *
 * @returns React element.
 */
export function NotFoundPage() {
  return (
    <MainLayout>
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <p className="text-6xl font-bold text-bm-border">404</p>
        <h1 className="text-xl font-semibold text-bm-textDark mt-4">Page not found</h1>
        <Link to="/" className="mt-6 text-sm text-bm-blue hover:underline">
          Back to home
        </Link>
      </div>
    </MainLayout>
  );
}
