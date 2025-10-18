import { MAX_FILE_SIZE, ALLOWED_FILE_TYPES, ALLOWED_MIME_TYPES } from './constants';

/**
 * Validation utilities
 */

export interface IValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validate uploaded file
 */
export function validateFile(file: File): IValidationResult {
  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File size exceeds maximum allowed size of ${Math.round(MAX_FILE_SIZE / 1024 / 1024)}MB`,
    };
  }

  // Check file type by extension
  const extension = file.name.toLowerCase().match(/\.[^.]+$/)?.[0]?.substring(1);
  if (!extension || !ALLOWED_FILE_TYPES.includes(extension as any)) {
    return {
      valid: false,
      error: `Invalid file type. Allowed types: ${ALLOWED_FILE_TYPES.join(', ')}`,
    };
  }

  // Check MIME type
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    console.warn(`Unexpected MIME type: ${file.type} for file: ${file.name}`);
    // Don't fail on MIME type mismatch, just warn
  }

  return { valid: true };
}

/**
 * Validate session name
 */
export function validateSessionName(name: string): IValidationResult {
  if (!name || name.trim().length === 0) {
    return { valid: false, error: 'Session name is required' };
  }

  if (name.length > 100) {
    return { valid: false, error: 'Session name must be less than 100 characters' };
  }

  return { valid: true };
}

/**
 * Validate pagination parameters
 */
export function validatePagination(page: number, pageSize: number): IValidationResult {
  if (page < 1) {
    return { valid: false, error: 'Page must be greater than 0' };
  }

  if (pageSize < 1 || pageSize > 1000) {
    return { valid: false, error: 'Page size must be between 1 and 1000' };
  }

  return { valid: true };
}

/**
 * Sanitize filename
 */
export function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/_{2,}/g, '_')
    .substring(0, 255);
}

/**
 * Validate column name
 */
export function validateColumnName(name: string, existingColumns: string[]): IValidationResult {
  if (!name || name.trim().length === 0) {
    return { valid: false, error: 'Column name is required' };
  }

  if (!existingColumns.includes(name)) {
    return { valid: false, error: `Column "${name}" does not exist` };
  }

  return { valid: true };
}
