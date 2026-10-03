import { useState, useEffect } from 'react';
import { Eye, EyeOff, Sparkles } from 'lucide-react';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import type { User } from '@/types';

interface ResetPasswordModalProps {
  user?: User;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (newPassword: string) => void;
}

export function ResetPasswordModal({ user, isOpen, onClose, onConfirm }: ResetPasswordModalProps) {
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setNewPassword('');
      setError(null);
      setShowPassword(false);
    }
  }, [isOpen]);

  function generatePassword() {
    const chars = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$';
    let pwd = '';
    for (let i = 0; i < 10; i++) {
      pwd += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewPassword(pwd);
    setShowPassword(true);
    setError(null);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    onConfirm(newPassword);
    onClose();
  }

  if (!user) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Reset Password for ${user.name}`}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit} disabled={newPassword.length < 6}>
            Update Password
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="rounded-lg border border-secondary-200 bg-secondary-50 p-3 text-sm">
          <p className="font-semibold text-ink">{user.name}</p>
          <p className="text-xs text-secondary-500">
            Username: <span className="font-mono font-medium text-ink">{user.username}</span> · Role:{' '}
            <span className="capitalize">{user.role}</span>
          </p>
        </div>

        <div>
          <div className="mb-1 flex items-center justify-between">
            <label htmlFor="reset-password-input" className="block text-sm font-medium text-secondary-700">
              New Password *
            </label>
            <button
              type="button"
              onClick={generatePassword}
              className="flex items-center gap-1 text-xs font-medium text-primary-600 hover:text-primary-700"
            >
              <Sparkles className="size-3" />
              Generate
            </button>
          </div>

          <div className="relative">
            <input
              id="reset-password-input"
              type={showPassword ? 'text' : 'password'}
              required
              value={newPassword}
              onChange={(e) => {
                setNewPassword(e.target.value);
                if (e.target.value.length >= 6) setError(null);
              }}
              placeholder="Enter at least 6 characters"
              className="w-full rounded-lg border border-secondary-200 px-3 py-2 pr-10 text-sm font-mono focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-secondary-400 hover:text-secondary-600"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
          {error && <p className="mt-1 text-xs text-danger-600">{error}</p>}
        </div>
      </form>
    </Modal>
  );
}
