import { Modal } from '@/components/common/Modal';
import { UserForm } from '@/components/forms/UserForm';
import type { User } from '@/types';
import type { UserFormValues, UserAssignableRole } from '@/utils/validators/userSchema';

interface UserFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (values: UserFormValues) => void;
  existingUser?: User;
}

export function UserFormModal({ isOpen, onClose, onSubmit, existingUser }: UserFormModalProps) {
  const initialRole: UserAssignableRole =
    existingUser && existingUser.role !== 'student'
      ? (existingUser.role as UserAssignableRole)
      : 'staff';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={existingUser ? `Edit User: ${existingUser.name}` : 'Add Staff, Librarian or Principal'}
      size="lg"
    >
      <UserForm
        existingUser={existingUser}
        initialValues={
          existingUser
            ? {
                name: existingUser.name,
                role: initialRole,
                username: existingUser.username,
                password: existingUser.password,
                email: existingUser.email ?? '',
                phone: existingUser.phone ?? '',
                status: existingUser.status,
              }
            : undefined
        }
        onSubmit={onSubmit}
        onCancel={onClose}
      />
    </Modal>
  );
}
