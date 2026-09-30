import { Modal } from '@/components/common/Modal';
import { BookForm } from '@/components/forms/BookForm';
import type { Book } from '@/types';
import type { BookFormValues } from '@/utils/validators/bookSchema';

interface BookFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (values: BookFormValues) => void;
  existingBook?: Book;
}

export function BookFormModal({ isOpen, onClose, onSubmit, existingBook }: BookFormModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={existingBook ? 'Edit Book' : 'Add New Book'} size="lg">
      <BookForm
        existingBook={existingBook}
        initialValues={existingBook}
        onSubmit={onSubmit}
        onCancel={onClose}
      />
    </Modal>
  );
}
