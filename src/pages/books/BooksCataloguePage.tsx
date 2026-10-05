import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Plus } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/common/Button';
import { DataTable } from '@/components/tables/DataTable';
import { createBookColumns } from '@/components/tables/columns/bookColumns';
import { BookFormModal } from '@/components/modals/BookFormModal';
import { useConfirm } from '@/components/common/ConfirmDialogProvider';
import { useCan } from '@/access/useCan';
import { useBooksStore } from '@/store/booksStore';
import { useCopiesStore } from '@/store/copiesStore';
import { ROUTES } from '@/routes/routePaths';
import type { Book } from '@/types';
import type { BookFormValues } from '@/utils/validators/bookSchema';
import { generateId } from '@/utils/id';
import { todayISO } from '@/utils/date';

export function BooksCataloguePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const confirm = useConfirm();

  const books = useBooksStore((s) => s.books);
  const addBook = useBooksStore((s) => s.addBook);
  const updateBook = useBooksStore((s) => s.updateBook);
  const retireBook = useBooksStore((s) => s.retireBook);
  const getByAccession = useBooksStore((s) => s.getByAccession);
  const addCopies = useCopiesStore((s) => s.addCopies);
  const removeAvailableCopies = useCopiesStore((s) => s.removeAvailableCopies);

  const [formOpen, setFormOpen] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | undefined>(undefined);

  const visibleBooks = useMemo(() => books, [books]);

  function openAddForm() {
    setEditingBook(undefined);
    setFormOpen(true);
  }

  function openEditForm(book: Book) {
    setEditingBook(book);
    setFormOpen(true);
  }

  async function handleRetire(book: Book) {
    const ok = await confirm({
      title: 'Retire this book?',
      description: `"${book.title}" (${book.accessionNumber}) will be marked retired and can no longer be issued.`,
      confirmLabel: 'Retire',
      tone: 'danger',
    });
    if (ok) {
      retireBook(book.id);
      toast.success('Book retired.');
    }
  }

  function handleFormSubmit(values: BookFormValues) {
    if (editingBook) {
      const delta = values.totalCopies - editingBook.totalCopies;
      if (delta > 0) {
        addCopies(editingBook.id, editingBook.accessionNumber, delta);
      } else if (delta < 0) {
        const removed = removeAvailableCopies(editingBook.accessionNumber, -delta);
        if (removed < -delta) {
          toast.error(`Only ${removed} spare copy/copies could be removed — the rest are currently on loan or held.`);
        }
      }
      const newAvailable = Math.max(0, Math.min(values.totalCopies, editingBook.availableCopies + delta));
      updateBook(editingBook.id, {
        ...values,
        isbn: values.isbn || undefined,
        publisher: values.publisher || undefined,
        edition: values.edition || undefined,
        department: values.department || undefined,
        dateOfPurchase: values.dateOfPurchase || undefined,
        acquisitionDate: values.dateOfPurchase || undefined,
        price: values.price !== undefined && !Number.isNaN(values.price) ? values.price : undefined,
        availableCopies: newAvailable,
        status: values.libraryUseOnly ? 'Available' : newAvailable > 0 ? 'Available' : 'Fully Issued',
      });
      toast.success('Book updated.');
      setFormOpen(false);
    } else {
      if (getByAccession(values.accessionNumber)) {
        toast.error('A book with this accession number already exists.');
        return;
      }
      const newBook: Book = {
        id: generateId('book'),
        ...values,
        classification: (values as any).classification || 'Course',
        isbn: values.isbn || undefined,
        publisher: values.publisher || undefined,
        edition: values.edition || undefined,
        department: values.department || undefined,
        dateOfPurchase: values.dateOfPurchase || undefined,
        acquisitionDate: values.dateOfPurchase || undefined,
        price: values.price !== undefined && !Number.isNaN(values.price) ? values.price : undefined,
        availableCopies: values.totalCopies,
        status: 'Available',
        addedDate: todayISO(),
      };
      addBook(newBook);
      addCopies(newBook.id, newBook.accessionNumber, newBook.totalCopies);
      toast.success('Book added to catalogue.');
      setFormOpen(false);
      navigate(ROUTES.bookDetails(newBook.id), { state: { printLabels: true } });
    }
  }

  const can = useCan();
  const canCreate = can('books', 'create');
  const canEdit = can('books', 'edit');
  const canRetire = can('books', 'delete');
  const columns = useMemo(
    () =>
      createBookColumns({
        onView: (book) => navigate(ROUTES.bookDetails(book.id)),
        onEdit: canEdit ? openEditForm : undefined,
        onRetire: canRetire ? handleRetire : undefined,
      }),
    [navigate, canEdit, canRetire],
  );

  return (
    <div>
      <PageHeader
        title="Books Catalogue"
        description={`${books.length} titles shown below — a working sample of the college's full ${books.length >= 60 ? '4,250+' : ''} title holdings.`}
        actions={
          canCreate && (
            <Button onClick={openAddForm}>
              <Plus className="size-4" /> Add Book
            </Button>
          )
        }
      />

      <DataTable
        data={visibleBooks}
        columns={columns}
        searchPlaceholder="Search by title, author, accession no..."
        initialSearch={searchParams.get('q') ?? ''}
        onRowClick={(book) => navigate(ROUTES.bookDetails(book.id))}
        emptyState={{
          title: 'No books found',
          description: 'Try a different search term or add a new book to the catalogue.',
          action: canCreate ? { label: 'Add Book', onClick: openAddForm } : undefined,
        }}
        pageSize={10}
      />

      <BookFormModal
        isOpen={formOpen}
        onClose={() => setFormOpen(false)}
        onSubmit={handleFormSubmit}
        existingBook={editingBook}
      />
    </div>
  );
}
