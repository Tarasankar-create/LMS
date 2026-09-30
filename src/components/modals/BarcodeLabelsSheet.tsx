import { useEffect, useRef } from 'react';
import JsBarcode from 'jsbarcode';
import { Printer, X } from 'lucide-react';
import { Button } from '@/components/common/Button';
import type { Book, BookCopy } from '@/types';

function Label({ barcode, title, shelf }: { barcode: string; title: string; shelf: string }) {
  const ref = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    JsBarcode(ref.current, barcode, {
      format: 'CODE128',
      height: 36,
      width: 1.6,
      fontSize: 11,
      margin: 4,
    });
  }, [barcode]);

  return (
    <div className="flex flex-col items-center justify-center gap-0.5 rounded border border-secondary-300 p-2 text-center break-inside-avoid">
      <p className="line-clamp-1 max-w-[180px] text-[10px] font-medium text-ink">{title}</p>
      <svg ref={ref} />
      <p className="text-[9px] text-secondary-500">Shelf {shelf}</p>
    </div>
  );
}

interface BarcodeLabelsSheetProps {
  book: Book;
  copies: BookCopy[];
  onClose: () => void;
}

/**
 * A full-screen printable sheet of Code128 barcode labels — one per physical copy.
 * Renders over the whole page (not a scoped Modal) so window.print() captures only this.
 */
export function BarcodeLabelsSheet({ book, copies, onClose }: BarcodeLabelsSheetProps) {
  return (
    <div className="fixed inset-0 z-[999] overflow-y-auto bg-white">
      <div className="no-print sticky top-0 flex items-center justify-between border-b border-secondary-200 bg-white px-6 py-3 shadow-sm">
        <div>
          <h2 className="text-sm font-semibold text-ink">Copy Labels — {book.title}</h2>
          <p className="text-xs text-secondary-500">
            {copies.length} label{copies.length === 1 ? '' : 's'} · {book.accessionNumber}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onClose}>
            <X className="size-4" /> Close
          </Button>
          <Button onClick={() => window.print()}>
            <Printer className="size-4" /> Print
          </Button>
        </div>
      </div>

      {copies.length === 0 ? (
        <p className="p-6 text-sm text-secondary-500">No copies to label yet.</p>
      ) : (
        <div className="grid grid-cols-2 gap-3 p-6 sm:grid-cols-3 md:grid-cols-4 print:grid-cols-3 print:gap-2 print:p-2">
          {copies.map((copy) => (
            <Label key={copy.id} barcode={copy.barcode} title={book.title} shelf={book.shelfLocation} />
          ))}
        </div>
      )}
    </div>
  );
}
