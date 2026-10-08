import { describe, it, expect } from 'vitest';
import * as XLSX from 'xlsx';
import { parseSpreadsheetFile, createColumnResolver } from './spreadsheet';

describe('spreadsheet utility', () => {
  it('parses CSV and Excel files correctly', async () => {
    // Create an in-memory XLSX workbook
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([
      ['AccessionNumber', 'Title', 'Copies'],
      ['PSC-1001', 'Test Book 1', '3'],
      ['PSC-1002', 'Test Book 2', '5'],
    ]);
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
    const xlsxBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });

    const file = new File([xlsxBuffer], 'test.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });

    const parsed = await parseSpreadsheetFile(file);
    expect(parsed.headers).toEqual(['AccessionNumber', 'Title', 'Copies']);
    expect(parsed.rows.length).toBe(2);
    expect(parsed.rows[0]).toEqual(['PSC-1001', 'Test Book 1', '3']);
    expect(parsed.rows[1]).toEqual(['PSC-1002', 'Test Book 2', '5']);
  });

  it('parses plain CSV files correctly', async () => {
    const csvContent = 'Name,RollNumber,Department\nAnanya,2026201,Science\nSubrat,2026202,Commerce';
    const file = new File([csvContent], 'test.csv', { type: 'text/csv' });

    const parsed = await parseSpreadsheetFile(file);
    expect(parsed.headers).toEqual(['Name', 'RollNumber', 'Department']);
    expect(parsed.rows.length).toBe(2);
    expect(parsed.rows[0]).toEqual(['Ananya', '2026201', 'Science']);
  });

  it('resolves columns with aliases and fallback', () => {
    const resolver = createColumnResolver(['Book Title', 'Acc No', 'Quantity']);
    expect(resolver(['title', 'booktitle'], 0)).toBe(0);
    expect(resolver(['accessionnumber', 'accno'], 1)).toBe(1);
    expect(resolver(['copies', 'quantity', 'qty'], 2)).toBe(2);
    expect(resolver(['isbn'], 5)).toBe(5); // fallback
  });
});

