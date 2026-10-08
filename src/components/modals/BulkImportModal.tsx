import { useState } from 'react';
import toast from 'react-hot-toast';
import { Download, FileSpreadsheet, Upload, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import { exportToExcel } from '@/utils/excelExport';
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
  const addBooks = useBooksStore((s) => s.addBooks);
  const addCopies = useCopiesStore((s) => s.addCopies);

  function handleDownloadTemplate() {
    exportToExcel(
      'ps_college_catalogue_template',
      [
        { header: 'AccessionNumber', accessor: (r: any) => r.accessionNumber },
        { header: 'Title', accessor: (r: any) => r.title },
        { header: 'Author', accessor: (r: any) => r.author },
        { header: 'Subject', accessor: (r: any) => r.subject },
        { header: 'Classification', accessor: (r: any) => r.classification },
        { header: 'Publisher', accessor: (r: any) => r.publisher },
        { header: 'Edition', accessor: (r: any) => r.edition },
        { header: 'ISBN', accessor: (r: any) => r.isbn },
        { header: 'Price', accessor: (r: any) => r.price },
        { header: 'Copies', accessor: (r: any) => r.copies },
        { header: 'ShelfLocation', accessor: (r: any) => r.shelfLocation },
        { header: 'LibraryUseOnly', accessor: (r: any) => r.libraryUseOnly },
      ],
      [
        {
          accessionNumber: 'PSC-9001',
          title: 'History of Odisha',
          author: 'N.K. Sahu',
          subject: 'History',
          classification: 'Stream - Arts',
          publisher: 'Kalyani Publishers',
          edition: '1st',
          isbn: '978-81-234-5678-9',
          price: 350,
          copies: 5,
          shelfLocation: 'A-105',
          libraryUseOnly: false,
        },
        {
          accessionNumber: 'PSC-9002',
          title: 'Modern Physics',
          author: 'Arthur Beiser',
          subject: 'Physics',
          classification: 'Stream - Science',
          publisher: 'McGraw Hill',
          edition: '6th',
          isbn: '978-00-704-9553-1',
          price: 520,
          copies: 4,
          shelfLocation: 'B-210',
          libraryUseOnly: false,
        },
        {
          accessionNumber: 'PSC-9003',
          title: 'Yojana Magazine (Oct 2026)',
          author: 'Govt of India',
          subject: 'Current Affairs',
          classification: 'Current Affairs',
          publisher: 'Publication Division',
          edition: '',
          isbn: 'N/A',
          price: 30,
          copies: 3,
          shelfLocation: 'REF-01',
          libraryUseOnly: true,
        },
      ],
    );
  }

  function handleDownloadErrorReport() {
    if (errorsList.length === 0) return;
    exportToExcel(
      'import_error_report',
      [
        { header: 'RowNumber', accessor: (err: RowError) => err.rowNumber },
        { header: 'FailedData', accessor: (err: RowError) => err.data },
        { header: 'Reason', accessor: (err: RowError) => err.reason },
      ],
      errorsList,
    );
  }

  async function handleProcessImport() {
    if (!file) {
      toast.error('Please choose an Excel file first.');
      return;
    }

    setIsProcessing(true);
    const text = await file.text();
    let dataRows: string[] = [];

    if (text.includes('<Row')) {
      const rowMatches = text.match(/<Row[\s\S]*?<\/Row>/gi) || [];
      dataRows = rowMatches.slice(1).map((rowXml) => {
        const cellMatches = rowXml.match(/<Data[\s\S]*?>([\s\S]*?)<\/Data>/gi) || [];
        return cellMatches
          .map((c) => c.replace(/<\/?Data[\s\S]*?>/gi, '').trim())
          .join(',');
      });
    } else {
      const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
      dataRows = lines.slice(1);
    }

    if (dataRows.length === 0) {
      toast.error('The selected file has no data rows.');
      setIsProcessing(false);
      return;
    }
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
        subject: subject || undefined,
        department: subject || undefined,
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
    addBooks(validBooksToAdd);
    validBooksToAdd.forEach((b) => {
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
    <Modal isOpen={isOpen} onClose={onClose} title="Upload Excel (Books)" size="lg">
      <div className="space-y-5">
        <p className="text-sm text-secondary-600">
          Upload an existing collection spreadsheet in Excel format. Valid records will be accessioned immediately; rows
          with missing or invalid data are rejected with a downloadable error log.
        </p>

        {/* Step 1: Template */}
        <div className="flex items-center justify-between rounded-lg border border-secondary-200 bg-secondary-50/50 p-3.5">
          <div className="flex items-center gap-3">
            <FileSpreadsheet className="size-5 text-primary-600" />
            <div>
              <p className="text-sm font-medium text-ink">Download Column Template</p>
              <p className="text-xs text-secondary-500">Standard Excel format with predefined column headers.</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={handleDownloadTemplate}>
            <Download className="mr-1.5 size-4" /> Download Template (Excel)
          </Button>
        </div>

        {/* Step 2: Upload */}
        {!importStats && (
          <div className="space-y-4">
            <div className="rounded-lg border-2 border-dashed border-secondary-300 p-6 text-center hover:border-primary-400">
              <Upload className="mx-auto size-8 text-secondary-400" />
              <div className="mt-2">
                <label className="cursor-pointer font-medium text-primary-600 hover:text-primary-500">
                  <span>Browse Excel file</span>
                  <input
                    type="file"
                    accept=".csv,.xls,.xlsx,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv"
                    className="sr-only"
                    onChange={(e) => {
                      if (e.target.files?.[0]) setFile(e.target.files[0]);
                    }}
                  />
                </label>
                <p className="mt-1 text-xs text-secondary-500">Excel spreadsheet up to 5MB</p>
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
                Upload Excel
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
                    <Download className="mr-1.5 size-3.5" /> Download Error Report (.xls)
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
