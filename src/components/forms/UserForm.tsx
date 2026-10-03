import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff, Sparkles, Shield } from 'lucide-react';
import { userSchema, ASSIGNABLE_ROLES, type UserFormValues, type UserAssignableRole } from '@/utils/validators/userSchema';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import type { User } from '@/types';

interface UserFormProps {
  initialValues?: Partial<UserFormValues>;
  existingUser?: User;
  onSubmit: (values: UserFormValues) => void;
  onCancel: () => void;
}

export function UserForm({ initialValues, existingUser, onSubmit, onCancel }: UserFormProps) {
  const [showPassword, setShowPassword] = useState(false);

  const initialRole: UserAssignableRole =
    existingUser && existingUser.role !== 'student'
      ? (existingUser.role as UserAssignableRole)
      : 'staff';

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<UserFormValues>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      name: existingUser?.name ?? '',
      role: initialRole,
      username: existingUser?.username ?? '',
      password: existingUser?.password ?? '',
      email: existingUser?.email ?? '',
      phone: existingUser?.phone ?? '',
      status: existingUser?.status ?? 'active',
      ...initialValues,
    },
  });

  const selectedRole = watch('role') as UserAssignableRole;
  const currentRoleMeta = ASSIGNABLE_ROLES.find((r) => r.value === selectedRole) ?? ASSIGNABLE_ROLES[0];

  function generatePassword() {
    const chars = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$';
    let pwd = '';
    for (let i = 0; i < 10; i++) {
      pwd += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setValue('password', pwd, { shouldValidate: true });
    setShowPassword(true);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      {/* Role Selection Dropdown (Highlighted as core requirement) */}
      <div className="rounded-xl border border-secondary-200 bg-secondary-50/70 p-4">
        <div className="mb-2 flex items-center justify-between">
          <label htmlFor="user-role" className="block text-sm font-semibold text-secondary-900">
            System Role *
          </label>
          <Badge tone={currentRoleMeta.badgeTone}>{currentRoleMeta.label}</Badge>
        </div>

        <select
          id="user-role"
          {...register('role')}
          className="w-full rounded-lg border border-secondary-200 bg-white px-3 py-2 text-sm font-medium text-ink shadow-sm focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100"
        >
          <option value="admin">Admin</option>
          <option value="librarian">Librarian</option>
          <option value="staff">Staff (College Staff)</option>
          <option value="principal">Principal</option>
        </select>
        {errors.role && <p className="mt-1 text-xs text-danger-600">{errors.role.message}</p>}

        {/* Dynamic role capability info note */}
        <div className="mt-2.5 flex items-start gap-2 rounded-lg bg-white p-2.5 text-xs text-secondary-600 border border-secondary-200/60">
          <Shield className="mt-0.5 size-3.5 shrink-0 text-primary-600" />
          <p>{currentRoleMeta.description}</p>
        </div>
      </div>

      {/* Name and Username */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="user-name" className="mb-1 block text-sm font-medium text-secondary-700">
            Full Name *
          </label>
          <input
            id="user-name"
            type="text"
            placeholder="e.g. Dr. Ramesh Chandra"
            {...register('name')}
            className="w-full rounded-lg border border-secondary-200 px-3 py-2 text-sm focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100"
          />
          {errors.name && <p className="mt-1 text-xs text-danger-600">{errors.name.message}</p>}
        </div>

        <div>
          <label htmlFor="user-username" className="mb-1 block text-sm font-medium text-secondary-700">
            Username / Login ID *
          </label>
          <input
            id="user-username"
            type="text"
            disabled={!!existingUser}
            placeholder="e.g. ramesh.c or staff2"
            {...register('username')}
            className="w-full rounded-lg border border-secondary-200 px-3 py-2 text-sm disabled:bg-secondary-100 disabled:text-secondary-500 focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100"
          />
          {errors.username ? (
            <p className="mt-1 text-xs text-danger-600">{errors.username.message}</p>
          ) : (
            <p className="mt-1 text-[11px] text-secondary-400">Used to sign in on the Staff Login tab.</p>
          )}
        </div>
      </div>

      {/* Password with generator & show/hide toggle */}
      <div>
        <div className="mb-1 flex items-center justify-between">
          <label htmlFor="user-password" className="block text-sm font-medium text-secondary-700">
            {existingUser ? 'Password *' : 'Initial Password *'}
          </label>
          {!existingUser && (
            <button
              type="button"
              onClick={generatePassword}
              className="flex items-center gap-1 text-xs font-medium text-primary-600 hover:text-primary-700"
            >
              <Sparkles className="size-3" />
              Generate Password
            </button>
          )}
        </div>
        <div className="relative">
          <input
            id="user-password"
            type={showPassword ? 'text' : 'password'}
            placeholder="Minimum 6 characters"
            {...register('password')}
            className="w-full rounded-lg border border-secondary-200 px-3 py-2 pr-10 text-sm focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100 font-mono"
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
        {errors.password && <p className="mt-1 text-xs text-danger-600">{errors.password.message}</p>}
      </div>

      {/* Contact Details: Email & Phone */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="user-email" className="mb-1 block text-sm font-medium text-secondary-700">
            Email Address (Optional)
          </label>
          <input
            id="user-email"
            type="email"
            placeholder="e.g. staff@pscollege.ac.in"
            {...register('email')}
            className="w-full rounded-lg border border-secondary-200 px-3 py-2 text-sm focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100"
          />
          {errors.email && <p className="mt-1 text-xs text-danger-600">{errors.email.message}</p>}
        </div>

        <div>
          <label htmlFor="user-phone" className="mb-1 block text-sm font-medium text-secondary-700">
            Phone Number (Optional)
          </label>
          <input
            id="user-phone"
            type="tel"
            placeholder="e.g. 9876543210"
            {...register('phone')}
            className="w-full rounded-lg border border-secondary-200 px-3 py-2 text-sm focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100"
          />
          {errors.phone && <p className="mt-1 text-xs text-danger-600">{errors.phone.message}</p>}
        </div>
      </div>

      {/* Account Status */}
      <div>
        <label htmlFor="user-status" className="mb-1 block text-sm font-medium text-secondary-700">
          Account Status
        </label>
        <select
          id="user-status"
          {...register('status')}
          className="w-full rounded-lg border border-secondary-200 bg-white px-3 py-2 text-sm focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100"
        >
          <option value="active">Active (Can log in immediately)</option>
          <option value="suspended">Suspended (Access temporarily disabled)</option>
        </select>
        {errors.status && <p className="mt-1 text-xs text-danger-600">{errors.status.message}</p>}
      </div>

      {/* Form Action Buttons */}
      <div className="flex justify-end gap-3 pt-3 border-t border-secondary-100">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : existingUser ? 'Save Changes' : `Add ${currentRoleMeta.label}`}
        </Button>
      </div>
    </form>
  );
}
