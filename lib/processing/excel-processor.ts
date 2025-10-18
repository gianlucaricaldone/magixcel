import * as XLSX from 'xlsx';
import { IFileMetadata, IProcessingOptions, IColumnType } from '@/types';
import { PREVIEW_ROW_COUNT } from '@/lib/utils/constants';
import { inferColumnType } from './type-inference';

/**
 * Process Excel files (XLSX, XLS)
 */
export async function processExcelFile(
  fileBuffer: Buffer,
  fileName: string,
  options: IProcessingOptions = {}
): Promise<{ metadata: IFileMetadata; data: any[] }> {
  try {
    // Read workbook
    const workbook = XLSX.read(fileBuffer, {
      type: 'buffer',
      cellDates: options.parseDates !== false,
      cellNF: false,
      cellText: false,
    });

    // Get first sheet
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) {
      throw new Error('No sheets found in Excel file');
    }

    const worksheet = workbook.Sheets[sheetName];

    // Convert to JSON
    const rawData: any[] = XLSX.utils.sheet_to_json(worksheet, {
      header: 1,
      defval: null,
      blankrows: !options.skipEmptyLines,
    });

    if (rawData.length === 0) {
      throw new Error('Excel file is empty');
    }

    // Extract headers (first row)
    const headers = rawData[0] as string[];
    const dataRows = rawData.slice(1);

    // Trim values if requested
    const processedData = dataRows.map((row) => {
      const obj: any = {};
      headers.forEach((header, index) => {
        let value = row[index];
        if (options.trimValues && typeof value === 'string') {
          value = value.trim();
        }
        if (options.parseNumbers && typeof value === 'string' && !isNaN(Number(value))) {
          value = Number(value);
        }
        obj[header] = value;
      });
      return obj;
    });

    // Infer column types if requested
    let columnTypes: IColumnType[] | undefined;
    if (options.inferTypes !== false) {
      columnTypes = headers.map((header) =>
        inferColumnType(header, processedData.map((row) => row[header]))
      );
    }

    // Get file extension
    const fileType = fileName.toLowerCase().endsWith('.xlsx')
      ? 'xlsx'
      : fileName.toLowerCase().endsWith('.xls')
      ? 'xls'
      : 'xlsx';

    // Create metadata
    const metadata: IFileMetadata = {
      fileName,
      fileSize: fileBuffer.length,
      fileType,
      rowCount: processedData.length,
      columnCount: headers.length,
      columns: headers,
      preview: processedData.slice(0, PREVIEW_ROW_COUNT),
      columnTypes,
    };

    return { metadata, data: processedData };
  } catch (error: any) {
    throw new Error(`Failed to process Excel file: ${error.message}`);
  }
}

/**
 * Validate Excel file
 */
export function validateExcelFile(file: File): { valid: boolean; error?: string } {
  const validExtensions = ['.xlsx', '.xls'];
  const extension = file.name.toLowerCase().match(/\.[^.]+$/)?.[0];

  if (!extension || !validExtensions.includes(extension)) {
    return {
      valid: false,
      error: 'Invalid file type. Please upload an Excel file (.xlsx or .xls)',
    };
  }

  return { valid: true };
}
