import { Link } from 'react-router-dom';
import { GraduationCap } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { ROUTES } from '@/routes/routePaths';

export function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-surface px-4 text-center">
      <div className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-primary-500 text-white">
        <GraduationCap className="size-7" />
      </div>
      <h1 className="text-3xl font-semibold text-ink">404</h1>
      <p className="mt-1 text-secondary-500">This page could not be found.</p>
      <Link to={ROUTES.login} className="mt-6">
        <Button>Back to Login</Button>
      </Link>
    </div>
  );
}
