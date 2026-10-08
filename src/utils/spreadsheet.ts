import * as XLSX from 'xlsx';

export interface ParsedSpreadsheet {
  headers: string[];
  rows: string[][];
}

/**
 * Parses any spreadsheet file (Excel .xlsx, .xls, or .csv) into clean header and row arrays.
 * Preserves all values as strings to avoid numeric precision loss or date formatting issues.
 */
export async function parseSpreadsheetFile(file: File): Promise<ParsedSpreadsheet> {
  const buffer = await file.arrayBuffer();
  // Read array buffer with SheetJS (supports XLSX, XLS, CSV, etc.)
  const workbook = XLSX.read(buffer, {
    type: 'array',
    cellDates: false,
    raw: false,
  });

  const sheetName = workbook.SheetNames[0];
  if (!sheetName) {
    return { headers: [], rows: [] };
  }

  const worksheet = workbook.Sheets[sheetName];
  if (!worksheet) {
    return { headers: [], rows: [] };
  }

  // Convert worksheet to 2D array of string rows
  const rawData: any[][] = XLSX.utils.sheet_to_json(worksheet, {
    header: 1,
    defval: '',
    blankrows: false,
    raw: false,
  });

  // Filter out rows that are completely empty
  const nonEmptyRows = rawData
    .map((r) => (Array.isArray(r) ? r.map((c) => String(c ?? '').trim()) : []))
    .filter((r) => r.some((c) => c !== ''));

  if (nonEmptyRows.length === 0) {
    return { headers: [], rows: [] };
  }

  const headers = nonEmptyRows[0];
  const rows = nonEmptyRows.slice(1);

  return { headers, rows };
}

/**
 * Downloads data as a native Excel (.xlsx) file in the browser.
 */
export function downloadExcelFile(
  filename: string,
  headers: string[],
  rows: (string | number | boolean | null | undefined)[][],
): void {
  const cleanBase = filename.replace(/\.(xlsx|xls|csv)$/i, '');
  const finalFilename = `${cleanBase}.xlsx`;

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');

  if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([wbout], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = finalFilename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } else {
    XLSX.writeFile(wb, finalFilename);
  }
}

/**
 * Creates a helper function to resolve column index by checking header names
 * with fallback to a default positional index.
 */
export function createColumnResolver(headers: string[]) {
  const normalizedHeaders = headers.map((h) => h.toLowerCase().replace(/[^a-z0-9]/g, ''));

  return function getColIndex(aliases: string[], fallbackIndex: number): number {
    for (const alias of aliases) {
      const norm = alias.toLowerCase().replace(/[^a-z0-9]/g, '');
      const idx = normalizedHeaders.indexOf(norm);
      if (idx !== -1) return idx;
    }
    return fallbackIndex;
  };
}

