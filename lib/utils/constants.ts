/**
 * Application constants
 */

// File upload limits
export const MAX_FILE_SIZE = parseInt(process.env.MAX_UPLOAD_SIZE || '1073741824'); // 1GB default
export const ALLOWED_FILE_TYPES = ['xlsx', 'xls', 'csv'] as const;
export const ALLOWED_MIME_TYPES = [
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // xlsx
  'application/vnd.ms-excel', // xls
  'text/csv', // csv
  'application/csv',
];

// Pagination
export const DEFAULT_PAGE_SIZE = 100;
export const MAX_PAGE_SIZE = 1000;

// Cache
export const CACHE_TTL_HOURS = 1;
export const CACHE_TTL_MS = CACHE_TTL_HOURS * 60 * 60 * 1000;

// Preview
export const PREVIEW_ROW_COUNT = 10;

// Error codes
export const ERROR_CODES = {
  INVALID_FILE_TYPE: 'INVALID_FILE_TYPE',
  FILE_TOO_LARGE: 'FILE_TOO_LARGE',
  SESSION_NOT_FOUND: 'SESSION_NOT_FOUND',
  PROCESSING_ERROR: 'PROCESSING_ERROR',
  INVALID_FILTER: 'INVALID_FILTER',
  EXPORT_FAILED: 'EXPORT_FAILED',
  ANALYSIS_FAILED: 'ANALYSIS_FAILED',
  DATABASE_ERROR: 'DATABASE_ERROR',
  STORAGE_ERROR: 'STORAGE_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
} as const;

// Storage
export const STORAGE_PATH = process.env.STORAGE_PATH || './data/uploads';
export const STORAGE_TYPE = (process.env.STORAGE_TYPE || 'local') as 'local' | 'cloud';
