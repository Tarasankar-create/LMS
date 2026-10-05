import { useState } from 'react';
import toast from 'react-hot-toast';
import { Download, FileSpreadsheet, Upload, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import { useBooksStore } from '@/store/booksStore';
import { useCopiesStore } from '@/store/copiesStore';
import { BOOK_CLASSIFICATIONS, type Book, type BookClassification } from '@/types';
import { generateId } from '@/utils/id';
import { todayISO } from '@/utils/date';

interface BulkImportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface RowError {
  rowNumber: number;
  data: string;
  reason: string;
}

export function BulkImportModal({ isOpen, onClose }: BulkImportModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [importStats, setImportStats] = useState<{ imported: number; failed: number } | null>(null);
  const [errorsList, setErrorsList] = useState<RowError[]>([]);

  const books = useBooksStore((s) => s.books);
  const addBook = useBooksStore((s) => s.addBook);
  const addCopies = useCopiesStore((s) => s.addCopies);

  function handleDownloadTemplate() {
    const headers = [
      'AccessionNumber',
      'Title',
      'Author',
      'Subject',
      'Classification',
      'Publisher',
      'Edition',
      'ISBN',
      'Price',
      'Copies',
      'ShelfLocation',
      'LibraryUseOnly',
    ];
    const sampleRows = [
      'PSC-9001,History of Odisha,N.K. Sahu,History,Stream - Arts,Kalyani Publishers,1st,978-81-234-5678-9,350,5,A-105,false',
      'PSC-9002,Modern Physics,Arthur Beiser,Physics,Stream - Science,McGraw Hill,6th,978-00-704-9553-1,520,4,B-210,false',
      'PSC-9003,Yojana Magazine (Oct 2026),Govt of India,Current Affairs,Current Affairs,Publication Division,,N/A,30,3,REF-01,true',
    ];
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...sampleRows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'ps_college_catalogue_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  function handleDownloadErrorReport() {
    if (errorsList.length === 0) return;
    const headers = ['RowNumber', 'FailedData', 'Reason'];
    const rows = errorsList.map((err) =>
      `"${err.rowNumber}","${err.data.replace(/"/g, '""')}","${err.reason.replace(/"/g, '""')}"`
    );
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'import_error_report.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  async function handleProcessImport() {
    if (!file) {
      toast.error('Please choose a CSV file first.');
      return;
    }

    setIsProcessing(true);
    const text = await file.text();
    const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);

    if (lines.length <= 1) {
      toast.error('The selected file has no data rows.');
      setIsProcessing(false);
      return;
    }

    const dataRows = lines.slice(1);
    const newErrors: RowError[] = [];
    const validBooksToAdd: Book[] = [];
    const existingAccessions = new Set(books.map((b) => b.accessionNumber.toUpperCase()));
    const batchAccessions = new Set<string>();

    dataRows.forEach((row, idx) => {
      const rowNum = idx + 2; // account for header line
      // Simple CSV cell parser handling commas inside quotes
      const cells: string[] = [];
      let current = '';
      let insideQuotes = false;
      for (let i = 0; i < row.length; i++) {
        const char = row[i];
        if (char === '"') {
          insideQuotes = !insideQuotes;
        } else if (char === ',' && !insideQuotes) {
          cells.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      cells.push(current.trim());

      const [
        rawAcc,
        rawTitle,
        rawAuthor,
        rawSubject,
        rawClass,
        rawPub,
        rawEd,
        rawIsbn,
        rawPrice,
        rawCopies,
        rawShelf,
        rawRefOnly,
      ] = cells;

      const acc = rawAcc?.trim() || '';
      const title = rawTitle?.trim() || '';
      const author = rawAuthor?.trim() || '';
      const subject = rawSubject?.trim() || '';
      const shelfLocation = rawShelf?.trim() || '';
      const copiesNum = parseInt(rawCopies || '1', 10);
      const priceNum = parseFloat(rawPrice || '0') || 0;

      // Validation
      if (!acc) {
        newErrors.push({ rowNumber: rowNum, data: row, reason: 'Missing required field: AccessionNumber' });
        return;
      }
      if (existingAccessions.has(acc.toUpperCase()) || batchAccessions.has(acc.toUpperCase())) {
        newErrors.push({ rowNumber: rowNum, data: row, reason: `Duplicate AccessionNumber: ${acc}` });
        return;
      }
      if (!title) {
        newErrors.push({ rowNumber: rowNum, data: row, reason: 'Missing required field: Title' });
        return;
      }
      if (!author) {
        newErrors.push({ rowNumber: rowNum, data: row, reason: 'Missing required field: Author' });
        return;
      }
      if (!subject) {
        newErrors.push({ rowNumber: rowNum, data: row, reason: 'Missing required field: Subject' });
        return;
      }
      if (isNaN(copiesNum) || copiesNum < 1) {
        newErrors.push({ rowNumber: rowNum, data: row, reason: 'Copies must be an integer of at least 1' });
        return;
      }
      if (!shelfLocation) {
        newErrors.push({ rowNumber: rowNum, data: row, reason: 'Missing required field: ShelfLocation' });
        return;
      }

      // Determine classification
      let classification: BookClassification = 'Course';
      if (rawClass && (BOOK_CLASSIFICATIONS as readonly string[]).includes(rawClass.trim())) {
        classification = rawClass.trim() as BookClassification;
      } else if (rawClass?.toLowerCase().includes('art')) {
        classification = 'Stream - Arts';
      } else if (rawClass?.toLowerCase().includes('science')) {
        classification = 'Stream - Science';
      } else if (rawClass?.toLowerCase().includes('journal')) {
        classification = 'Journals';
      } else if (rawClass?.toLowerCase().includes('affair')) {
        classification = 'Current Affairs';
      }

      batchAccessions.add(acc.toUpperCase());

      const book: Book = {
        id: generateId('book'),
        accessionNumber: acc,
        title,
        author,
        category: classification.startsWith('Stream - Science')
          ? 'Science'
          : classification.startsWith('Stream - Arts')
            ? 'Arts'
            : classification === 'Journals'
              ? 'Journals and Magazines'
              : 'Commerce',
        classification,
        publisher: rawPub?.trim() || undefined,
        edition: rawEd?.trim() || undefined,
        isbn: rawIsbn?.trim() || undefined,
        price: priceNum,
        totalCopies: copiesNum,
        availableCopies: copiesNum,
        shelfLocation,
        libraryUseOnly: rawRefOnly?.toLowerCase() === 'true' || rawRefOnly === '1',
        status: 'Available',
        addedDate: todayISO(),
      };
      validBooksToAdd.push(book);
    });

    // Commit valid books
    validBooksToAdd.forEach((b) => {
      addBook(b);
      addCopies(b.id, b.accessionNumber, b.totalCopies);
    });

    setImportStats({
      imported: validBooksToAdd.length,
      failed: newErrors.length,
    });
    setErrorsList(newErrors);
    setIsProcessing(false);

    if (validBooksToAdd.length > 0 && newErrors.length === 0) {
      toast.success(`Successfully imported all ${validBooksToAdd.length} titles into the catalogue!`);
    } else if (validBooksToAdd.length > 0) {
      toast.success(`Imported ${validBooksToAdd.length} titles. ${newErrors.length} row(s) had errors.`);
    } else {
      toast.error(`All ${newErrors.length} rows failed validation. Download error report for details.`);
    }
  }

  function handleReset() {
    setFile(null);
    setImportStats(null);
    setErrorsList([]);
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Bulk Import Catalogue (FR-CAT-03)" size="lg">
      <div className="space-y-5">
        <p className="text-sm text-secondary-600">
          Upload an existing collection spreadsheet in CSV format. Valid records will be accessioned immediately; rows
          with missing or invalid data are rejected with a downloadable error log.
        </p>

        {/* Step 1: Template */}
        <div className="flex items-center justify-between rounded-lg border border-secondary-200 bg-secondary-50/50 p-3.5">
          <div className="flex items-center gap-3">
            <FileSpreadsheet className="size-5 text-primary-600" />
            <div>
              <p className="text-sm font-medium text-ink">Download Column Template</p>
              <p className="text-xs text-secondary-500">Standard CSV format with predefined column headers.</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={handleDownloadTemplate}>
            <Download className="mr-1.5 size-4" /> Download Template
          </Button>
        </div>

        {/* Step 2: Upload */}
        {!importStats && (
          <div className="space-y-4">
            <div className="rounded-lg border-2 border-dashed border-secondary-300 p-6 text-center hover:border-primary-400">
              <Upload className="mx-auto size-8 text-secondary-400" />
              <div className="mt-2">
                <label className="cursor-pointer font-medium text-primary-600 hover:text-primary-500">
                  <span>Browse CSV file</span>
                  <input
                    type="file"
                    accept=".csv"
                    className="sr-only"
                    onChange={(e) => {
                      if (e.target.files?.[0]) setFile(e.target.files[0]);
                    }}
                  />
                </label>
                <p className="mt-1 text-xs text-secondary-500">CSV spreadsheet up to 5MB</p>
              </div>
              {file && (
                <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-primary-50 px-3 py-1 text-xs font-medium text-primary-700">
                  <CheckCircle2 className="size-3.5" /> {file.name} ({(file.size / 1024).toFixed(1)} KB)
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button disabled={!file || isProcessing} isLoading={isProcessing} onClick={handleProcessImport}>
                Start Bulk Import
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Result Summary */}
        {importStats && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-lg border border-success-200 bg-success-50 p-4">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="size-5 text-success-600" />
                  <span className="text-sm font-semibold text-success-800">Successfully Imported</span>
                </div>
                <p className="mt-2 text-2xl font-bold text-success-700">{importStats.imported} titles</p>
              </div>
              <div
                className={`rounded-lg border p-4 ${importStats.failed > 0
                  ? 'border-danger-200 bg-danger-50 text-danger-800'
                  : 'border-secondary-200 bg-secondary-50 text-secondary-600'
                  }`}
              >
                <div className="flex items-center gap-2">
                  <AlertCircle className={`size-5 ${importStats.failed > 0 ? 'text-danger-600' : 'text-secondary-400'}`} />
                  <span className="text-sm font-semibold">Rejected / Failed</span>
                </div>
                <p className={`mt-2 text-2xl font-bold ${importStats.failed > 0 ? 'text-danger-700' : ''}`}>
                  {importStats.failed} rows
                </p>
              </div>
            </div>

            {errorsList.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase text-danger-700">
                    Validation Errors ({errorsList.length})
                  </span>
                  <Button variant="outline" size="sm" onClick={handleDownloadErrorReport}>
                    <Download className="mr-1.5 size-3.5" /> Download Error Report (.csv)
                  </Button>
                </div>
                <div className="max-h-40 overflow-y-auto rounded-lg border border-secondary-200 bg-secondary-50 p-2 text-xs">
                  {errorsList.slice(0, 10).map((err, i) => (
                    <div key={i} className="border-b border-secondary-100 py-1 last:border-none">
                      <span className="font-semibold text-danger-600">Row {err.rowNumber}:</span> {err.reason}
                    </div>
                  ))}
                  {errorsList.length > 10 && (
                    <p className="pt-1 text-center italic text-secondary-500">
                      ...and {errorsList.length - 10} more errors in downloaded report.
                    </p>
                  )}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-3 border-t border-secondary-100">
              <Button variant="outline" onClick={handleReset}>
                Import Another File
              </Button>
              <Button onClick={onClose}>Done</Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
