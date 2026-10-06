import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Eye, EyeOff, KeyRound, Check, Copy, ExternalLink, AlertCircle } from 'lucide-react';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { useAccessStore } from '@/access/accessStore';
import { usePasswordResetStore } from '@/store/passwordResetStore';
import { ROUTES } from '@/routes/routePaths';
import type { User } from '@/types';

interface PasswordResetLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultUsername?: string;
}

export function PasswordResetLinkModal({
  isOpen,
  onClose,
  defaultUsername = '',
}: PasswordResetLinkModalProps) {
  const navigate = useNavigate();
  const verifyUserPassword = useAccessStore((s) => s.verifyUserPassword);
  const createToken = usePasswordResetStore((s) => s.createToken);

  const [username, setUsername] = useState(defaultUsername);
  const [oldPassword, setOldPassword] = useState('');
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Success state with generated token and link
  const [generatedUser, setGeneratedUser] = useState<User | null>(null);
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  const [targetPath, setTargetPath] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Synchronize initial state whenever the modal opens or defaultUsername changes
  useEffect(() => {
    if (isOpen) {
      setUsername(defaultUsername);
      setOldPassword('');
      setShowOldPassword(false);
      setError(null);
      setIsSubmitting(false);
      setGeneratedUser(null);
      setGeneratedLink(null);
      setTargetPath(null);
      setCopied(false);
    }
  }, [isOpen, defaultUsername]);

  function handleClose() {
    setError(null);
    setGeneratedLink(null);
    onClose();
  }

  function handleVerifyAndGenerate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const cleanUsername = username.trim();
    if (!cleanUsername) {
      setError('Please enter your username or student roll number.');
      return;
    }
    if (!oldPassword) {
      setError('Please enter your current (old) password.');
      return;
    }

    setIsSubmitting(true);

    try {
      const verification = verifyUserPassword(cleanUsername, oldPassword);

      if (!verification.ok || !verification.user) {
        setError(verification.error ?? 'Invalid username or incorrect password.');
        setIsSubmitting(false);
        return;
      }

      // Generate the secure token
      const tokenRecord = createToken(verification.user);
      const relativePath = `${ROUTES.resetPassword}?token=${encodeURIComponent(tokenRecord.token)}`;
      const fullUrl = `${window.location.origin}${relativePath}`;

      setGeneratedUser(verification.user);
      setTargetPath(relativePath);
      setGeneratedLink(fullUrl);
      toast.success('Password reset link generated successfully!');
    } catch {
      setError('Failed to generate reset link. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleCopyLink() {
    if (!generatedLink) return;
    try {
      await navigator.clipboard.writeText(generatedLink);
      setCopied(true);
      toast.success('Reset link copied to clipboard!');
      setTimeout(() => setCopied(false), 2500);
    } catch {
      toast.error('Unable to copy to clipboard.');
    }
  }

  function handleOpenResetForm() {
    if (!targetPath) return;
    handleClose();
    navigate(targetPath);
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={generatedLink ? 'Password Reset Link Ready' : 'Reset Account Password'}
      footer={
        generatedLink ? (
          <div className="flex w-full items-center justify-end gap-2">
            <Button variant="outline" onClick={handleClose}>
              Close
            </Button>
            <Button onClick={handleOpenResetForm} className="gap-2">
              <KeyRound className="size-4" />
              Open Reset Password Form
            </Button>
          </div>
        ) : (
          <div className="flex w-full items-center justify-end gap-2">
            <Button variant="outline" type="button" onClick={handleClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              type="submit"
              form="reset-link-verify-form"
              isLoading={isSubmitting}
              className="gap-2"
            >
              <KeyRound className="size-4" />
              Submit & Generate Link
            </Button>
          </div>
        )
      }
    >
      {!generatedLink ? (
        <form id="reset-link-verify-form" onSubmit={handleVerifyAndGenerate} className="space-y-4">
          <p className="text-xs text-secondary-600 leading-relaxed">
            Please enter your login username (or Student Roll Number) and your current password. A
            secure password reset link will be generated for your account.
          </p>

          {error && (
            <div className="flex items-start gap-2.5 rounded-lg border border-danger-200 bg-danger-50 p-3 text-xs text-danger-700">
              <AlertCircle className="mt-0.5 size-4 shrink-0 text-danger-500" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label htmlFor="reset-username" className="mb-1 block text-xs font-semibold text-secondary-700">
              Username / Student Roll Number *
            </label>
            <input
              id="reset-username"
              type="text"
              autoFocus
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                if (error) setError(null);
              }}
              placeholder="e.g. librarian, admin, staff, or 2026001"
              className="w-full rounded-lg border border-secondary-200 px-3 py-2 text-sm focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100"
            />
            <p className="mt-1 text-[11px] text-secondary-400">
              Works for all staff, librarians, principals, and student accounts.
            </p>
          </div>

          <div>
            <label htmlFor="reset-old-password" className="mb-1 block text-xs font-semibold text-secondary-700">
              Old Password (Current Password) *
            </label>
            <div className="relative">
              <input
                id="reset-old-password"
                type={showOldPassword ? 'text' : 'password'}
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
                onClick={() => setShowOldPassword(!showOldPassword)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-secondary-400 hover:text-secondary-600"
                aria-label={showOldPassword ? 'Hide password' : 'Show password'}
              >
                {showOldPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </div>
        </form>
      ) : (
        <div className="space-y-4">
          <div className="flex items-start gap-3 rounded-xl border border-accent-200 bg-accent-50/60 p-4">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-accent-600 text-white">
              <Check className="size-4" />
            </div>
            <div>
              <p className="text-sm font-semibold text-accent-950">Reset Link Successfully Generated</p>
              <p className="mt-0.5 text-xs text-accent-800">
                A one-time secure link has been generated. Click the link or the button below to open the
                password reset form.
              </p>
            </div>
          </div>

          {generatedUser && (
            <div className="rounded-lg border border-secondary-200 bg-secondary-50 p-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-ink">{generatedUser.name}</span>
                <Badge tone="primary">{generatedUser.role}</Badge>
              </div>
              <p className="mt-1 text-secondary-500 font-mono">@{generatedUser.username}</p>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-secondary-700">
              Generated Reset URL (Click or copy):
            </label>
            <div className="flex items-center gap-2">
              <div className="flex-1 overflow-hidden rounded-lg border border-secondary-200 bg-white px-3 py-2">
                <a
                  href={generatedLink}
                  onClick={(e) => {
                    e.preventDefault();
                    handleOpenResetForm();
                  }}
                  className="block truncate font-mono text-xs text-primary-600 hover:underline cursor-pointer"
                  title="Click to open reset password form"
                >
                  {generatedLink}
                </a>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleCopyLink}
                className="shrink-0 gap-1.5"
              >
                {copied ? <Check className="size-3.5 text-accent-600" /> : <Copy className="size-3.5" />}
                {copied ? 'Copied' : 'Copy'}
              </Button>
            </div>
          </div>

          <div className="rounded-lg border border-primary-100 bg-primary-50/60 p-3 text-xs text-primary-900">
            <div className="flex items-start gap-2">
              <ExternalLink className="mt-0.5 size-4 shrink-0 text-primary-600" />
              <p>
                Clicking the link or <strong>Open Reset Password Form</strong> will direct you to the
                password change screen where you will provide your old password, enter your new
                password, and confirm it.
              </p>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}
