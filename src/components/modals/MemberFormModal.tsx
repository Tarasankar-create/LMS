import { Modal } from '@/components/common/Modal';
import { MemberForm } from '@/components/forms/MemberForm';
import type { Member } from '@/types';
import type { MemberFormValues } from '@/utils/validators/memberSchema';

interface MemberFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (values: MemberFormValues) => void;
  existingMember?: Member;
}

export function MemberFormModal({ isOpen, onClose, onSubmit, existingMember }: MemberFormModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={existingMember ? 'Edit Member' : 'Add New Member'} size="lg">
      <MemberForm existingMember={existingMember} initialValues={existingMember} onSubmit={onSubmit} onCancel={onClose} />
    </Modal>
  );
}
