import type { BookClassification } from './book';

export type JournalPublishStatus = 'Draft' | 'Published';

export interface Journal {
  id: string;
  title: string;
  author: string;
  classification: BookClassification;
  fileReference: string;
  fileSize?: string;
  publishStatus: JournalPublishStatus;
  description?: string;
  uploadedBy: string;
  uploadedAt: string;
  publishedAt?: string;
  downloadCount: number;
}

// Backward-compatibility aliases
export type EBookPublishStatus = JournalPublishStatus;
export type EBook = Journal;

