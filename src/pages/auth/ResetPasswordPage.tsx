import { useState, useMemo } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Eye, EyeOff, KeyRound, CheckCircle2, AlertTriangle, ArrowLeft, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { usePasswordResetStore } from '@/store/passwordResetStore';
import { useAccessStore } from '@/access/accessStore';
import { ROUTES } from '@/routes/routePaths';
import { cn } from '@/utils/cn';

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const tokenString = searchParams.get('token') || '';

  const getToken = usePasswordResetStore((s) => s.getToken);
  const markTokenAsUsed = usePasswordResetStore((s) => s.markTokenAsUsed);
  const resetPasswordWithOldPassword = useAccessStore((s) => s.resetPasswordWithOldPassword);
  const users = useAccessStore((s) => s.users);

  // Validate the token from the store
  const tokenRecord = useMemo(() => {
    return getToken(tokenString);
  }, [getToken, tokenString]);

  // Target user record
  const targetUser = useMemo(() => {
    if (!tokenRecord) return undefined;
    return users.find((u) => u.id === tokenRecord.userId);
  }, [tokenRecord, users]);

  // Form states
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Password visibility toggles
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Form error & success states
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Real-time dynamic validation checks
  const passwordsMatch = confirmPassword.length > 0 && newPassword.length > 0 && confirmPassword === newPassword;
  const passwordsMismatch = confirmPassword.length > 0 && confirmPassword !== newPassword;
  const newPasswordTooShort = newPassword.length > 0 && newPassword.length < 6;
  const newPasswordSameAsOld = newPassword.length > 0 && oldPassword.length > 0 && newPassword === oldPassword;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!tokenRecord || !targetUser) {
      setError('This password reset link is invalid or has expired.');
      return;
    }

    if (!oldPassword) {
      setError('Please enter your old (current) password.');
      return;
    }

    if (!newPassword) {
      setError('Please enter a new password.');
      return;
    }

    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters long.');
      return;
    }

    if (newPassword === oldPassword) {
      setError('New password cannot be the same as your old password.');
      return;
    }

    if (!confirmPassword) {
      setError('Please re-type your new password in the "Again type new password" field.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match. Please ensure "New password" and "Again type new password" are identical.');
      return;
    }

    setIsSubmitting(true);

    try {
      const result = resetPasswordWithOldPassword(targetUser.id, oldPassword, newPassword);

      if (!result.ok) {
        setError(result.error);
        setIsSubmitting(false);
        return;
      }

      // Mark the reset token as used so it cannot be used again
      markTokenAsUsed(tokenRecord.token);
      setIsSuccess(true);
      toast.success('Your password has been changed successfully!');
    } catch {
      setError('An unexpected error occurred while resetting your password. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  // 1. Invalid or missing token state
  if (!tokenRecord || !targetUser) {
    return (
      <div className="space-y-5 text-center">
        <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-danger-100 text-danger-600">
          <AlertTriangle className="size-6" />
        </div>

        <div>
          <h2 className="font-display text-xl font-bold text-ink">Invalid or Expired Link</h2>
          <p className="mt-1 text-xs text-secondary-600 leading-relaxed">
            This password reset link is invalid, has expired, or has already been used. Please visit the
            login page and request a new password reset link.
          </p>
        </div>

        <div className="pt-2">
          <Button onClick={() => navigate(ROUTES.login)} className="w-full gap-2">
            <ArrowLeft className="size-4" />
            Back to Login
          </Button>
        </div>
      </div>
    );
  }

  // 2. Success state after password change
  if (isSuccess) {
    return (
      <div className="space-y-5 text-center">
        <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-accent-100 text-accent-700">
          <CheckCircle2 className="size-6" />
        </div>

        <div>
          <h2 className="font-display text-xl font-bold text-ink">Password Changed Successfully!</h2>
          <p className="mt-1 text-xs text-secondary-600 leading-relaxed">
            Your password for account <strong className="text-secondary-900 font-mono">@{targetUser.username}</strong>{' '}
            has been updated. You can now log in using your new credentials.
          </p>
        </div>

        <div className="rounded-xl border border-secondary-200 bg-secondary-50/70 p-3 text-xs text-secondary-700">
          <ShieldCheck className="mx-auto mb-1 size-4 text-accent-600" />
          <p>Your session is secured. Please sign in to proceed.</p>
        </div>

        <div className="pt-2">
          <Button onClick={() => navigate(ROUTES.login)} size="lg" className="w-full gap-2">
            Proceed to Login
          </Button>
        </div>
      </div>
    );
  }

  // 3. Reset Password Form
  return (
    <div className="space-y-5">
      <div className="text-center sm:text-left">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="font-display text-xl font-bold text-ink">Reset Password</h2>
          <Badge tone="primary">{targetUser.role}</Badge>
        </div>
        <p className="text-xs text-secondary-600">
          Updating credentials for{' '}
          <strong className="text-secondary-900">{targetUser.name}</strong> (
          <code className="text-secondary-800 font-mono">@{targetUser.username}</code>)
        </p>
      </div>

      {error && (
        <div className="flex items-start gap-2.5 rounded-lg border border-danger-200 bg-danger-50 p-3 text-xs text-danger-700">
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-danger-500" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {/* Field 1: Old Password */}
        <div>
          <label htmlFor="old-password" className="mb-1 block text-xs font-semibold text-secondary-700">
            Old Password *
          </label>
          <div className="relative">
            <input
              id="old-password"
              type={showOld ? 'text' : 'password'}
              autoComplete="current-password"
              value={oldPassword}
              onChange={(e) => {
                setOldPassword(e.target.value);
                if (error) setError(null);
              }}
              placeholder="Enter your current password"
              className="w-full rounded-lg border border-secondary-200 px-3 py-2 pr-10 text-sm focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100 font-mono"
            />
            <button
              type="button"
              onClick={() => setShowOld(!showOld)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-secondary-400 hover:text-secondary-600"
              aria-label={showOld ? 'Hide old password' : 'Show old password'}
            >
              {showOld ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
        </div>

        {/* Field 2: New Password */}
        <div>
          <label htmlFor="new-password" className="mb-1 block text-xs font-semibold text-secondary-700">
            New Password *
          </label>
          <div className="relative">
            <input
              id="new-password"
              type={showNew ? 'text' : 'password'}
              autoComplete="new-password"
              value={newPassword}
              onChange={(e) => {
                setNewPassword(e.target.value);
                if (error) setError(null);
              }}
              placeholder="Minimum 6 characters"
              className={cn(
                'w-full rounded-lg border px-3 py-2 pr-10 text-sm font-mono transition-colors focus:outline-none focus:ring-2',
                newPasswordSameAsOld
                  ? 'border-danger-300 bg-danger-50/20 focus:border-danger-400 focus:ring-danger-100'
                  : 'border-secondary-200 focus:border-primary-400 focus:ring-primary-100',
              )}
            />
            <button
              type="button"
              onClick={() => setShowNew(!showNew)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-secondary-400 hover:text-secondary-600"
              aria-label={showNew ? 'Hide new password' : 'Show new password'}
            >
              {showNew ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>

          {newPasswordSameAsOld ? (
            <p className="mt-1 flex items-center gap-1 text-xs text-danger-600">
              <AlertTriangle className="size-3 shrink-0" />
              New password cannot be identical to your old password.
            </p>
          ) : newPasswordTooShort ? (
            <p className="mt-1 text-xs text-amber-600">
              Must be at least 6 characters (currently {newPassword.length}/6).
            </p>
          ) : (
            <p className="mt-1 text-[11px] text-secondary-400">
              Must be at least 6 characters and different from old password.
            </p>
          )}
        </div>

        {/* Field 3: Re-Type new password with real-time verification */}
        <div>
          <div className="mb-1 flex items-center justify-between">
            <label htmlFor="confirm-password" className="block text-xs font-semibold text-secondary-700">
              Re-Type new password *
            </label>
            {confirmPassword.length > 0 && (
              <span
                className={cn(
                  'inline-flex items-center gap-1 text-[11px] transition-colors',
                  passwordsMatch ? 'font-semibold text-accent-700' : 'text-danger-600',
                )}
              >
                {passwordsMatch ? (
                  <>
                    <CheckCircle2 className="size-3.5 text-accent-600" />
                    Passwords match
                  </>
                ) : (
                  <>
                    <AlertTriangle className="size-3.5 text-danger-500" />
                    Does not match
                  </>
                )}
              </span>
            )}
          </div>
          <div className="relative">
            <input
              id="confirm-password"
              type={showConfirm ? 'text' : 'password'}
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                if (error) setError(null);
              }}
              placeholder="Re-enter your new password"
              className={cn(
                'w-full rounded-lg border px-3 py-2 pr-10 text-sm font-mono transition-colors focus:outline-none focus:ring-2',
                passwordsMatch
                  ? 'border-accent-400 bg-accent-50/20 focus:border-accent-500 focus:ring-accent-100'
                  : passwordsMismatch
                    ? 'border-danger-300 bg-danger-50/20 focus:border-danger-400 focus:ring-danger-100'
                    : 'border-secondary-200 focus:border-primary-400 focus:ring-primary-100',
              )}
            />
            <button
              type="button"
              onClick={() => setShowConfirm(!showConfirm)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-secondary-400 hover:text-secondary-600"
              aria-label={showConfirm ? 'Hide password confirmation' : 'Show password confirmation'}
            >
              {showConfirm ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>

          {/* Real-time verification helper text */}
          {confirmPassword.length > 0 && (
            <p
              className={cn(
                'mt-1.5 flex items-center gap-1.5 text-xs',
                passwordsMatch ? 'text-accent-700' : 'text-danger-600',
              )}
            >
              {passwordsMatch ? (
                <>
                  <CheckCircle2 className="size-3.5 shrink-0 text-accent-600" />
                  <span>Verified: Matches your new password.</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="size-3.5 shrink-0 text-danger-500" />
                  <span>Passwords do not match yet. Please make sure both fields are identical.</span>
                </>
              )}
            </p>
          )}
        </div>

        {/* Submit and Back Actions */}
        <div className="space-y-2 pt-2">
          <Button
            type="submit"
            size="lg"
            className="w-full gap-2"
            isLoading={isSubmitting}
            disabled={passwordsMismatch || newPasswordTooShort || newPasswordSameAsOld}
          >
            <KeyRound className="size-4" />
            Change Password
          </Button>

          <div className="text-center">
            <Link
              to={ROUTES.login}
              className="inline-flex items-center gap-1.5 text-xs text-secondary-500 hover:text-secondary-800"
            >
              <ArrowLeft className="size-3" />
              Cancel and return to sign in
            </Link>
          </div>
        </div>
      </form>
    </div>
  );
}
