import * as XLSX from 'xlsx';
import { IFileMetadata, IProcessingOptions, IColumnType } from '@/types';
import { PREVIEW_ROW_COUNT } from '@/lib/utils/constants';
import { inferColumnType } from './type-inference';

export interface ISheetData {
  sheetName: string;
  data: any[];
  columns: string[];
  rowCount: number;
  columnCount: number;
  columnTypes?: IColumnType[];
  filteredRowCount?: number; // Track filtered rows for this sheet
}

/**
 * Process Excel files (XLSX, XLS) - All sheets
 */
export async function processExcelFile(
  fileBuffer: Buffer,
  fileName: string,
  options: IProcessingOptions = {}
): Promise<{ metadata: IFileMetadata; data: any[]; sheets: ISheetData[] }> {
  try {
    // Read workbook
    const workbook = XLSX.read(fileBuffer, {
      type: 'buffer',
      cellDates: options.parseDates !== false,
      cellNF: false,
      cellText: false,
    });

    if (workbook.SheetNames.length === 0) {
      throw new Error('No sheets found in Excel file');
    }

    // Process all sheets
    const sheets: ISheetData[] = [];

    for (const sheetName of workbook.SheetNames) {
      const worksheet = workbook.Sheets[sheetName];

      // Convert to JSON
      const rawData: any[] = XLSX.utils.sheet_to_json(worksheet, {
        header: 1,
        defval: null,
        blankrows: !options.skipEmptyLines,
      });

      if (rawData.length === 0) {
        // Skip empty sheets
        continue;
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

      // Add sheet data
      sheets.push({
        sheetName,
        data: processedData,
        columns: headers,
        rowCount: processedData.length,
        columnCount: headers.length,
        columnTypes,
      });
    }

    if (sheets.length === 0) {
      throw new Error('No valid sheets found in Excel file');
    }

    // Use first sheet as default
    const firstSheet = sheets[0];

    // Get file extension
    const fileType = fileName.toLowerCase().endsWith('.xlsx')
      ? 'xlsx'
      : fileName.toLowerCase().endsWith('.xls')
      ? 'xls'
      : 'xlsx';

    // Create metadata (based on first sheet)
    const metadata: IFileMetadata = {
      fileName,
      fileSize: fileBuffer.length,
      fileType,
      rowCount: firstSheet.rowCount,
      columnCount: firstSheet.columnCount,
      columns: firstSheet.columns,
      preview: firstSheet.data.slice(0, PREVIEW_ROW_COUNT),
      columnTypes: firstSheet.columnTypes,
      sheetCount: sheets.length,
      sheetNames: sheets.map(s => s.sheetName),
    };

    return { metadata, data: firstSheet.data, sheets };
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
