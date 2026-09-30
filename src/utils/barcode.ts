/** Copy barcode and ISBN helpers shared by the add-book, issue, return and request-hold flows. */

/** e.g. ("PSC-0001", 3) -> "PSC-0001-03" */
export function generateCopyBarcode(accessionNumber: string, copyNumber: number): string {
  return `${accessionNumber}-${String(copyNumber).padStart(2, '0')}`;
}

/** Recovers the accession number from a copy barcode ("PSC-0001-03" -> "PSC-0001"). */
export function accessionFromCopyBarcode(barcode: string): string {
  return barcode.replace(/-\d+$/, '');
}

/** Strips spaces/hyphens and validates an ISBN-10 or ISBN-13 checksum. Returns the cleaned digits, or null if invalid. */
export function validateIsbn(raw: string): string | null {
  const cleaned = raw.replace(/[\s-]/g, '').toUpperCase();
  if (/^\d{9}[\dX]$/.test(cleaned)) {
    let sum = 0;
    for (let i = 0; i < 9; i += 1) sum += (10 - i) * Number(cleaned[i]);
    const last = cleaned[9] === 'X' ? 10 : Number(cleaned[9]);
    sum += last;
    return sum % 11 === 0 ? cleaned : null;
  }
  if (/^\d{13}$/.test(cleaned)) {
    let sum = 0;
    for (let i = 0; i < 13; i += 1) sum += Number(cleaned[i]) * (i % 2 === 0 ? 1 : 3);
    return sum % 10 === 0 ? cleaned : null;
  }
  return null;
}

/** Formats a 13-digit ISBN with the conventional hyphens; returns other lengths unchanged. */
export function formatIsbn(cleaned: string): string {
  if (cleaned.length !== 13) return cleaned;
  return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 4)}-${cleaned.slice(4, 8)}-${cleaned.slice(8, 12)}-${cleaned.slice(12)}`;
}
