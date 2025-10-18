/**
 * Data processing type definitions
 */

import { IColumnType } from './filters';

export interface IUploadResult {
  success: boolean;
  sessionId?: string;
  metadata?: IFileMetadata;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

export interface IFileMetadata {
  fileName: string;
  fileSize: number;
  fileType: 'xlsx' | 'xls' | 'csv';
  rowCount: number;
  columnCount: number;
  columns: string[];
  preview: any[];
  columnTypes?: IColumnType[];
}

export interface IFilterResult {
  success: boolean;
  results?: {
    data: any[];
    totalRows: number;
    filteredRows: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
  filterHash?: string;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

export interface IExportOptions {
  format: 'csv' | 'xlsx' | 'json';
  includeHeaders?: boolean;
  delimiter?: string; // For CSV
  sheetName?: string; // For XLSX
}

export interface IAnalysisResult {
  success: boolean;
  analysis?: {
    type: 'summary' | 'patterns' | 'duplicates' | 'outliers';
    results: any;
  };
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

export interface IPaginationParams {
  page: number;
  pageSize: number;
}

// IColumnType is defined in filters.ts to avoid duplication

export interface IProcessingOptions {
  skipEmptyLines?: boolean;
  trimValues?: boolean;
  parseNumbers?: boolean;
  parseDates?: boolean;
  inferTypes?: boolean;
}
