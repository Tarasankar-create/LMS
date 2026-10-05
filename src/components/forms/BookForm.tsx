import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Check, ScanLine, X } from 'lucide-react';
import { bookSchema, type BookFormValues } from '@/utils/validators/bookSchema';
import { BOOK_CATEGORIES, type Book } from '@/types';
import { Button } from '@/components/common/Button';
import { validateIsbn } from '@/utils/barcode';

interface BookFormProps {
  initialValues?: Partial<BookFormValues>;
  existingBook?: Book;
  onSubmit: (values: BookFormValues) => void;
  onCancel: () => void;
}

export function BookForm({ initialValues, existingBook, onSubmit, onCancel }: BookFormProps) {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<BookFormValues>({
    resolver: zodResolver(bookSchema),
    defaultValues: {
      accessionNumber: '',
      title: '',
      author: '',
      category: 'Science',
      isbn: '',
      publisher: '',
      edition: '',
      totalCopies: 1,
      shelfLocation: '',
      libraryUseOnly: false,
      ...initialValues,
    },
  });

  const isbnValue = watch('isbn') ?? '';
  const isbnCheck = validateIsbn(isbnValue);

  return (
    <form id="book-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="book-accession" className="mb-1 block text-sm font-medium text-secondary-700">
            Accession Number
          </label>
          <input
            id="book-accession"
            {...register('accessionNumber')}
            disabled={!!existingBook}
            className="w-full rounded-lg border border-secondary-200 px-3 py-2 text-sm disabled:bg-secondary-50 focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100"
          />
          {errors.accessionNumber && <p className="mt-1 text-xs text-danger-600">{errors.accessionNumber.message}</p>}
        </div>
        <div>
          <label htmlFor="book-category" className="mb-1 block text-sm font-medium text-secondary-700">
            Category
          </label>
          <select
            id="book-category"
            {...register('category')}
            className="w-full rounded-lg border border-secondary-200 px-3 py-2 text-sm focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100"
          >
            {BOOK_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="book-title" className="mb-1 block text-sm font-medium text-secondary-700">
          Title
        </label>
        <input
          id="book-title"
          {...register('title')}
          className="w-full rounded-lg border border-secondary-200 px-3 py-2 text-sm focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100"
        />
        {errors.title && <p className="mt-1 text-xs text-danger-600">{errors.title.message}</p>}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="book-author" className="mb-1 block text-sm font-medium text-secondary-700">
            Author
          </label>
          <input
            id="book-author"
            {...register('author')}
            className="w-full rounded-lg border border-secondary-200 px-3 py-2 text-sm focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100"
          />
          {errors.author && <p className="mt-1 text-xs text-danger-600">{errors.author.message}</p>}
        </div>
        <div>
          <label htmlFor="book-isbn" className="mb-1 block text-sm font-medium text-secondary-700">
            ISBN (optional) — scan the barcode on the back cover
          </label>
          <div className="relative">
            <ScanLine className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-secondary-400" />
            <input
              id="book-isbn"
              {...register('isbn')}
              placeholder="Scan or type the ISBN"
              className="w-full rounded-lg border border-secondary-200 py-2 pl-9 pr-9 text-sm focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100"
            />
            {isbnValue.trim() && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2">
                {isbnCheck ? (
                  <Check className="size-4 text-success-600" aria-label="Valid ISBN" />
                ) : (
                  <X className="size-4 text-danger-500" aria-label="Invalid ISBN checksum" />
                )}
              </span>
            )}
          </div>
          {isbnValue.trim() && !isbnCheck && (
            <p className="mt-1 text-xs text-danger-600">
              That doesn't check out as a valid ISBN-10/13 — double-check the scan, or leave it blank.
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <label htmlFor="book-copies" className="mb-1 block text-sm font-medium text-secondary-700">
            Total Copies
          </label>
          <input
            id="book-copies"
            type="number"
            min={1}
            {...register('totalCopies', { valueAsNumber: true })}
            className="w-full rounded-lg border border-secondary-200 px-3 py-2 text-sm focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100"
          />
          {errors.totalCopies && <p className="mt-1 text-xs text-danger-600">{errors.totalCopies.message}</p>}
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="book-shelf" className="mb-1 block text-sm font-medium text-secondary-700">
            Shelf Location
          </label>
          <input
            id="book-shelf"
            {...register('shelfLocation')}
            placeholder="e.g. A-101"
            className="w-full rounded-lg border border-secondary-200 px-3 py-2 text-sm focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100"
          />
          {errors.shelfLocation && <p className="mt-1 text-xs text-danger-600">{errors.shelfLocation.message}</p>}
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm text-secondary-600">
        <input
          type="checkbox"
          {...register('libraryUseOnly')}
          className="size-4 rounded border-secondary-300 text-primary-500 focus:ring-primary-400"
        />
        Library use only (reference/rare — not issued out)
      </label>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" isLoading={isSubmitting}>
          {existingBook ? 'Save Changes' : 'Add Book'}
        </Button>
      </div>
    </form>
  );
}
