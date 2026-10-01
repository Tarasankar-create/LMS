import type { BookClassification } from './book';

export type EBookPublishStatus = 'Draft' | 'Published';

export interface EBook {
  id: string;
  title: string;
  author: string;
  classification: BookClassification;
  fileReference: string;
  fileSize?: string;
  publishStatus: EBookPublishStatus;
  description?: string;
  uploadedBy: string;
  uploadedAt: string;
  publishedAt?: string;
  downloadCount: number;
}
