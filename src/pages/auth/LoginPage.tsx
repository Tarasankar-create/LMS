import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Eye, EyeOff, GraduationCap, Landmark, KeyRound } from 'lucide-react';
import { loginSchema, type LoginFormValues } from '@/utils/validators/loginSchema';
import { useAuthStore, type LoginKind } from '@/store/authStore';
import { useAccessStore } from '@/access/accessStore';
import { homePathFor } from '@/access/homePath';
import { DEMO_LOGIN_HINTS } from '@/data/users';
import { Button } from '@/components/common/Button';
import { PasswordResetLinkModal } from '@/components/modals/PasswordResetLinkModal';
import { cn } from '@/utils/cn';

const TABS: { kind: LoginKind; label: string; hint: string; icon: typeof Landmark; usernameLabel: string; placeholder: string }[] = [
  { kind: 'staff', label: 'Staff', hint: 'Administrator, Librarian, Principal', icon: Landmark, usernameLabel: 'Username', placeholder: 'e.g. librarian' },
  { kind: 'student', label: 'Student', hint: 'College roll number', icon: GraduationCap, usernameLabel: 'Roll Number', placeholder: '2026001' },
];

// Set to true to display the secondary reset password helper banner below the submit button
const SHOW_RESET_BANNER = false;

export function LoginPage() {
  const [searchParams] = useSearchParams();
  const requested = searchParams.get('role');
  // ?role=student opens the Student tab; any other value opens the Staff tab.
  const initialKind: LoginKind = requested === 'student' ? 'student' : 'staff';
  const [activeKind, setActiveKind] = useState<LoginKind>(initialKind);
  const [showPassword, setShowPassword] = useState(false);
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const login = useAuthStore((s) => s.login);
  const lastUsername = useAuthStore((s) => s.lastUsername);
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { kind: initialKind, username: lastUsername ?? '', password: '', rememberMe: !!lastUsername },
  });

  function handleKindChange(kind: LoginKind) {
    setActiveKind(kind);
    setValue('kind', kind);
    setValue('username', '');
    setValue('password', '');
  }

  function fillDemo(username: string, password: string) {
    setValue('username', username);
    setValue('password', password);
  }

  function onSubmit(values: LoginFormValues) {
    const result = login(values.kind, values.username, values.password, values.rememberMe);
    if (!result.success) {
      toast.error(result.error ?? 'Login failed. Please check your credentials.');
      return;
    }
    toast.success('Signed in successfully.');
    const user = useAuthStore.getState().currentUser;
    navigate(homePathFor(user?.role, useAccessStore.getState().matrix), { replace: true });
  }

  const activeTab = TABS.find((t) => t.kind === activeKind)!;
  const hints = DEMO_LOGIN_HINTS.filter((h) => (activeKind === 'student') === (h.role === 'Student'));

  return (
    <div>
      <div role="group" aria-label="Account type" className="mb-6 grid grid-cols-2 gap-2 rounded-xl bg-secondary-100 p-1">
        {TABS.map((tab) => (
          <button
            key={tab.kind}
            type="button"
            aria-pressed={activeKind === tab.kind}
            onClick={() => handleKindChange(tab.kind)}
            className={cn(
              'flex flex-col items-center gap-1 rounded-lg py-2 text-xs font-medium transition-colors sm:text-sm',
              activeKind === tab.kind ? 'bg-white text-primary-600 shadow-sm' : 'text-secondary-500 hover:text-secondary-700',
            )}
          >
            <tab.icon className="size-4" />
            {tab.label}
          </button>
        ))}
      </div>
      <p className="-mt-3 mb-5 text-center text-xs text-secondary-500">{activeTab.hint}</p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <div>
          <label htmlFor="username" className="mb-1 block text-sm font-medium text-secondary-700">
            {activeTab.usernameLabel}
          </label>
          <input
            id="username"
            type="text"
            autoComplete="username"
            placeholder={activeTab.placeholder}
            {...register('username')}
            className="w-full rounded-lg border border-secondary-200 px-3 py-2.5 text-sm focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100"
          />
          {errors.username && <p className="mt-1 text-xs text-danger-600">{errors.username.message}</p>}
        </div>

        <div>
          <label htmlFor="password" className="mb-1 block text-sm font-medium text-secondary-700">
            Password
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder="••••••••"
              {...register('password')}
              className="w-full rounded-lg border border-secondary-200 px-3 py-2.5 pr-10 text-sm focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary-500 hover:text-secondary-600"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
          {errors.password && <p className="mt-1 text-xs text-danger-600">{errors.password.message}</p>}
        </div>

        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-sm text-secondary-600">
            <input type="checkbox" {...register('rememberMe')} className="size-4 rounded border-secondary-300 text-primary-500 focus:ring-primary-400" />
            Remember me
          </label>
          <button
            type="button"
            onClick={() => setResetModalOpen(true)}
            className="text-sm font-semibold text-primary-600 hover:text-primary-700 hover:underline"
          >
            Reset password?
          </button>
        </div>

        <Button type="submit" className="w-full" size="lg" isLoading={isSubmitting}>
          Sign in as {activeTab.label}
        </Button>

        {/* Highlighted Reset Password banner (hidden for now per request) */}
        {SHOW_RESET_BANNER && (
          <div className="rounded-lg border border-primary-200 bg-primary-50/70 p-3 text-center">
            <p className="text-xs text-secondary-700">
              Need to change your login credentials?
            </p>
            <button
              type="button"
              onClick={() => setResetModalOpen(true)}
              className="mt-1 text-xs font-bold text-primary-700 hover:text-primary-800 hover:underline inline-flex items-center gap-1.5"
            >
              <KeyRound className="size-3.5" />
              Click here to Reset Password
            </button>
          </div>
        )}
      </form>

      <div className="mt-5 rounded-lg border border-dashed border-secondary-200 bg-secondary-50 p-3 text-xs text-secondary-500">
        <p className="mb-2 font-medium text-secondary-600">Demo accounts (dummy data)</p>
        <ul className="space-y-1.5">
          {hints.map((h) => (
            <li key={h.username} className="flex items-center justify-between gap-2">
              <span>
                <span className="font-medium text-secondary-700">{h.role}:</span> <code className="text-secondary-700">{h.username}</code> /{' '}
                <code className="text-secondary-700">{h.password}</code>
              </span>
              <button type="button" onClick={() => fillDemo(h.username, h.password)} className="flex-none font-medium text-accent-600 hover:text-accent-700">
                Use<span className="sr-only"> the {h.role} demo account</span>
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* Password Reset Modal with username & old password verification + link generator */}
      <PasswordResetLinkModal
        isOpen={resetModalOpen}
        onClose={() => setResetModalOpen(false)}
        defaultUsername={watch('username')}
      />
    </div>
  );
}
