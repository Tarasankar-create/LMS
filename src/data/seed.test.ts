import { describe, it, expect } from 'vitest';
import { seedDemoData } from '@/data/bootstrap';

describe('seed consistency', () => {
  it('copies match book availability and loans', () => {
    const data = seedDemoData();
    expect(data.copies.length).toBeGreaterThan(0);
    expect(data.requests.length).toBeGreaterThan(0);

    for (const book of data.books) {
      const copies = data.copies.filter((c) => c.accessionNumber === book.accessionNumber);
      expect(copies.length).toBe(book.totalCopies);
      const available = copies.filter((c) => c.status === 'Available').length;
      expect(available).toBe(book.availableCopies);
    }

    // every active loan's copy barcode really is marked Issued
    for (const loan of data.loans.filter((l) => l.status === 'Active')) {
      expect(loan.copyBarcode).toBeTruthy();
      const copy = data.copies.find((c) => c.barcode === loan.copyBarcode);
      expect(copy?.status).toBe('Issued');
    }

    // approved requests hold a real, Held copy
    for (const req of data.requests.filter((r) => r.status === 'Approved')) {
      const copy = data.copies.find((c) => c.barcode === req.heldCopyBarcode);
      expect(copy?.status).toBe('Held');
    }

    // no barcode collisions
    const barcodes = data.copies.map((c) => c.barcode);
    expect(new Set(barcodes).size).toBe(barcodes.length);
  });
});
