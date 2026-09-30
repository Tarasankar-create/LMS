import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { memberSchema, type MemberFormValues } from '@/utils/validators/memberSchema';
import { DEPARTMENTS, ACADEMIC_YEARS } from '@/constants/departments';
import { Button } from '@/components/common/Button';
import type { Member } from '@/types';

interface MemberFormProps {
  initialValues?: Partial<MemberFormValues>;
  existingMember?: Member;
  onSubmit: (values: MemberFormValues) => void;
  onCancel: () => void;
}

export function MemberForm({ initialValues, existingMember, onSubmit, onCancel }: MemberFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<MemberFormValues>({
    resolver: zodResolver(memberSchema),
    defaultValues: {
      name: '',
      rollNumber: '',
      department: DEPARTMENTS[0],
      academicYear: ACADEMIC_YEARS[0],
      email: '',
      phone: '',
      status: 'Active',
      ...initialValues,
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="member-name" className="mb-1 block text-sm font-medium text-secondary-700">
            Full Name
          </label>
          <input
            id="member-name"
            {...register('name')}
            className="w-full rounded-lg border border-secondary-200 px-3 py-2 text-sm focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100"
          />
          {errors.name && <p className="mt-1 text-xs text-danger-600">{errors.name.message}</p>}
        </div>
        <div>
          <label htmlFor="member-roll" className="mb-1 block text-sm font-medium text-secondary-700">
            Roll Number
          </label>
          <input
            id="member-roll"
            {...register('rollNumber')}
            disabled={!!existingMember}
            className="w-full rounded-lg border border-secondary-200 px-3 py-2 text-sm disabled:bg-secondary-50 focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100"
          />
          {errors.rollNumber && <p className="mt-1 text-xs text-danger-600">{errors.rollNumber.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="member-department" className="mb-1 block text-sm font-medium text-secondary-700">
            Department
          </label>
          <select
            id="member-department"
            {...register('department')}
            className="w-full rounded-lg border border-secondary-200 px-3 py-2 text-sm focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100"
          >
            {DEPARTMENTS.map((dept) => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="member-year" className="mb-1 block text-sm font-medium text-secondary-700">
            Academic Year
          </label>
          <select
            id="member-year"
            {...register('academicYear')}
            className="w-full rounded-lg border border-secondary-200 px-3 py-2 text-sm focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100"
          >
            {ACADEMIC_YEARS.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="member-email" className="mb-1 block text-sm font-medium text-secondary-700">
            Email
          </label>
          <input
            id="member-email"
            type="email"
            {...register('email')}
            className="w-full rounded-lg border border-secondary-200 px-3 py-2 text-sm focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100"
          />
          {errors.email && <p className="mt-1 text-xs text-danger-600">{errors.email.message}</p>}
        </div>
        <div>
          <label htmlFor="member-phone" className="mb-1 block text-sm font-medium text-secondary-700">
            Phone
          </label>
          <input
            id="member-phone"
            {...register('phone')}
            className="w-full rounded-lg border border-secondary-200 px-3 py-2 text-sm focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100"
          />
          {errors.phone && <p className="mt-1 text-xs text-danger-600">{errors.phone.message}</p>}
        </div>
      </div>

      <div>
        <label htmlFor="member-status" className="mb-1 block text-sm font-medium text-secondary-700">
          Membership Status
        </label>
        <select
          id="member-status"
          {...register('status')}
          className="w-full rounded-lg border border-secondary-200 px-3 py-2 text-sm focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100"
        >
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
          <option value="Suspended">Suspended</option>
        </select>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" isLoading={isSubmitting}>
          {existingMember ? 'Save Changes' : 'Add Member'}
        </Button>
      </div>
    </form>
  );
}
