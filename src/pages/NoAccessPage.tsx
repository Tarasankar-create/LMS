import { useNavigate } from 'react-router-dom';
import { ShieldOff } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { useAuthStore } from '@/store/authStore';
import { ROUTES } from '@/routes/routePaths';

/** Shown when a signed-in account has no permission for any page. */
export function NoAccessPage() {
  const navigate = useNavigate();
  const logout = useAuthStore((s) => s.logout);
  return (
    <div className="mx-auto mt-16 max-w-md rounded-xl border border-secondary-100 bg-white p-8 text-center shadow-sm">
      <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-warning-50">
        <ShieldOff className="size-6 text-warning-600" />
      </div>
      <h1 className="text-lg font-semibold text-ink">No access</h1>
      <p className="mt-2 text-sm text-secondary-500">
        Your account doesn&apos;t currently have permission to open any page. Please contact the administrator.
      </p>
      <Button
        className="mt-5"
        onClick={() => {
          logout();
          navigate(ROUTES.login);
        }}
      >
        Sign out
      </Button>
    </div>
  );
}
