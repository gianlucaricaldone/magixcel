import Papa from 'papaparse';
import { IFileMetadata, IProcessingOptions, IColumnType } from '@/types';
import { PREVIEW_ROW_COUNT } from '@/lib/utils/constants';
import { inferColumnType } from './type-inference';

/**
 * Process CSV files
 */
export async function processCSVFile(
  fileBuffer: Buffer,
  fileName: string,
  options: IProcessingOptions = {}
): Promise<{ metadata: IFileMetadata; data: any[] }> {
  return new Promise((resolve, reject) => {
    try {
      const fileContent = fileBuffer.toString('utf8');

      Papa.parse(fileContent, {
        header: true,
        skipEmptyLines: options.skipEmptyLines !== false,
        transformHeader: (header) => {
          return options.trimValues ? header.trim() : header;
        },
        transform: (value, header) => {
          let transformedValue: any = value;

          // Trim values
          if (options.trimValues && typeof transformedValue === 'string') {
            transformedValue = transformedValue.trim();
          }

          // Parse numbers
          if (options.parseNumbers !== false && typeof transformedValue === 'string') {
            const num = Number(transformedValue);
            if (!isNaN(num) && transformedValue !== '') {
              transformedValue = num;
            }
          }

          // Parse dates
          if (options.parseDates !== false && typeof transformedValue === 'string') {
            const date = new Date(transformedValue);
            if (!isNaN(date.getTime()) && transformedValue.match(/^\d{4}-\d{2}-\d{2}/)) {
              transformedValue = date;
            }
          }

          return transformedValue;
        },
        complete: (results) => {
          try {
            if (results.errors.length > 0) {
              console.warn('CSV parsing warnings:', results.errors);
            }

            const data = results.data as any[];

            if (data.length === 0) {
              reject(new Error('CSV file is empty'));
              return;
            }

            // Get headers from first row keys
            const headers = Object.keys(data[0]);

            // Infer column types if requested
            let columnTypes: IColumnType[] | undefined;
            if (options.inferTypes !== false) {
              columnTypes = headers.map((header) =>
                inferColumnType(header, data.map((row) => row[header]))
              );
            }

            // Create metadata
            const metadata: IFileMetadata = {
              fileName,
              fileSize: fileBuffer.length,
              fileType: 'csv',
              rowCount: data.length,
              columnCount: headers.length,
              columns: headers,
              preview: data.slice(0, PREVIEW_ROW_COUNT),
              columnTypes,
            };

            resolve({ metadata, data });
          } catch (error: any) {
            reject(new Error(`Failed to process CSV results: ${error.message}`));
          }
        },
        error: (error: Error) => {
          reject(new Error(`CSV parsing failed: ${error.message}`));
        },
      });
    } catch (error: any) {
      reject(new Error(`Failed to process CSV file: ${error.message}`));
    }
  });
}

/**
 * Validate CSV file
 */
export function validateCSVFile(file: File): { valid: boolean; error?: string } {
  const validExtensions = ['.csv'];
  const extension = file.name.toLowerCase().match(/\.[^.]+$/)?.[0];

  if (!extension || !validExtensions.includes(extension)) {
    return {
      valid: false,
      error: 'Invalid file type. Please upload a CSV file',
    };
  }

  return { valid: true };
}
