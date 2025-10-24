/**
 * Parquet Converter
 *
 * Converts Excel/CSV files to Parquet format using DuckDB
 * Extracts metadata (sheets, columns, row counts, statistics)
 */

import { DuckDBClient, createDuckDBClient } from '../duckdb/client';
import { ISessionMetadata, ISheetMetadata, IColumnMetadata } from '../adapters/db/interface';
import fs from 'fs';
import { createHash } from 'crypto';

export interface IConversionResult {
  parquetPath: string;
  metadata: ISessionMetadata;
  fileHash: string;
  compressionRatio: number;
  processingTime: number;
}

export interface IConversionOptions {
  inputPath: string;
  outputPath: string;
  fileType: 'xlsx' | 'xls' | 'csv';
  tempDir?: string;
}

export class ParquetConverter {
  private client: DuckDBClient;

  constructor() {
    this.client = createDuckDBClient();
  }

  /**
   * Convert file to Parquet and extract metadata
   */
  async convert(options: IConversionOptions): Promise<IConversionResult> {
    const startTime = Date.now();

    console.log(`[ParquetConverter] Starting conversion: ${options.inputPath}`);

    // Ensure DuckDB is connected
    await this.client.connect();

    try {
      // Get file hash
      const fileHash = await this.calculateFileHash(options.inputPath);

      // Load file into DuckDB based on type
      let tableName: string;
      if (options.fileType === 'csv') {
        tableName = await this.loadCSVFile(options.inputPath);
      } else {
        tableName = await this.loadExcelFile(options.inputPath);
      }

      // Extract metadata
      const metadata = await this.extractMetadata(tableName, options.fileType);

      // Export to Parquet
      await this.exportToParquet(tableName, options.outputPath, metadata);

      // Calculate compression ratio
      const originalSize = fs.statSync(options.inputPath).size;
      const parquetSize = fs.statSync(options.outputPath).size;
      const compressionRatio = parquetSize / originalSize;

      const processingTime = Date.now() - startTime;

      console.log(`[ParquetConverter] Conversion completed in ${processingTime}ms`);
      console.log(`[ParquetConverter] Compression: ${originalSize} → ${parquetSize} bytes (${(compressionRatio * 100).toFixed(2)}%)`);

      return {
        parquetPath: options.outputPath,
        metadata: {
          ...metadata,
          parquetSize,
          compressionRatio,
          processingTime,
        },
        fileHash,
        compressionRatio,
        processingTime,
      };
    } catch (error: any) {
      console.error('[ParquetConverter] Conversion failed:', error);
      throw new Error(`Parquet conversion failed: ${error.message}`);
    }
  }

  /**
   * Load CSV file into DuckDB
   */
  private async loadCSVFile(filePath: string): Promise<string> {
    console.log(`[ParquetConverter] Loading CSV: ${filePath}`);

    // DuckDB auto-detects CSV format
    const tableName = await this.client.loadCSV(filePath, {
      tableName: 'csv_data',
      header: true,
    });

    return tableName;
  }

  /**
   * Load Excel file into DuckDB
   * Note: For Excel, we need to handle multiple sheets
   */
  private async loadExcelFile(filePath: string): Promise<string> {
    console.log(`[ParquetConverter] Loading Excel: ${filePath}`);

    // For now, use ExcelJS to read Excel and convert to CSV, then load with DuckDB
    // Full DuckDB Excel support requires spatial extension (st_read)
    // Alternative: Read with ExcelJS, write temp CSV, load into DuckDB

    // TODO: Implement proper multi-sheet Excel loading
    // For MVP, we can use a simpler approach with ExcelJS

    const ExcelJS = require('exceljs');
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filePath);

    // Create a table that includes all sheets with a 'sheet' column
    const combinedTableName = 'excel_all_sheets';

    // First sheet to initialize table
    let firstSheet = true;

    for (const worksheet of workbook.worksheets) {
      const sheetName = worksheet.name;
      const rows: any[] = [];

      // Get headers from first row
      const headerRow = worksheet.getRow(1);
      const headers = headerRow.values as any[];
      const cleanHeaders = headers.slice(1); // Remove first empty element

      // Get data rows
      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return; // Skip header

        const values = row.values as any[];
        const cleanValues = values.slice(1); // Remove first empty element

        const rowData: any = { sheet: sheetName };
        cleanHeaders.forEach((header, index) => {
          rowData[header] = cleanValues[index];
        });

        rows.push(rowData);
      });

      // Insert into DuckDB
      if (rows.length > 0) {
        // Create INSERT statement
        const columns = Object.keys(rows[0]);
        const columnsList = columns.map(c => `"${c}"`).join(', ');

        if (firstSheet) {
          // Create table with first sheet
          const createSQL = `CREATE TABLE ${combinedTableName} AS SELECT * FROM (VALUES ${this.rowsToValues(rows, columns)}) AS t(${columnsList})`;
          await this.client.query(createSQL);
          firstSheet = false;
        } else {
          // Insert additional sheets
          const insertSQL = `INSERT INTO ${combinedTableName} SELECT * FROM (VALUES ${this.rowsToValues(rows, columns)}) AS t(${columnsList})`;
          await this.client.query(insertSQL);
        }
      }
    }

    return combinedTableName;
  }

  /**
   * Convert rows array to SQL VALUES format
   */
  private rowsToValues(rows: any[], columns: string[]): string {
    return rows.map(row => {
      const values = columns.map(col => {
        const val = row[col];
        if (val === null || val === undefined) return 'NULL';
        if (typeof val === 'string') return `'${val.replace(/'/g, "''")}'`;
        if (typeof val === 'number') return String(val);
        if (typeof val === 'boolean') return val ? 'true' : 'false';
        return `'${String(val).replace(/'/g, "''")}'`;
      });
      return `(${values.join(', ')})`;
    }).join(', ');
  }

  /**
   * Extract metadata from loaded table
   */
  private async extractMetadata(tableName: string, fileType: 'xlsx' | 'xls' | 'csv'): Promise<ISessionMetadata> {
    console.log(`[ParquetConverter] Extracting metadata from ${tableName}`);

    // Get schema
    const schema = await this.client.getSchema(tableName);

    // For CSV: single sheet
    if (fileType === 'csv') {
      const rowCount = await this.client.getRowCount(tableName);

      const columns: IColumnMetadata[] = schema.map(col => ({
        name: col.name,
        type: this.normalizeType(col.type),
      }));

      const sheets: ISheetMetadata[] = [
        {
          name: 'Sheet1', // Default name for CSV
          rowCount,
          columnCount: columns.length,
          columns,
        },
      ];

      return {
        sheets,
        totalRows: rowCount,
        totalColumns: columns.length,
      };
    }

    // For Excel: multiple sheets
    // Get unique sheet names
    const sheetsQuery = await this.client.query(`SELECT DISTINCT sheet FROM ${tableName}`);
    const sheetNames = sheetsQuery.rows.map((row: any) => row.sheet);

    const sheets: ISheetMetadata[] = [];
    let totalRows = 0;

    for (const sheetName of sheetNames) {
      const rowCountQuery = await this.client.query(
        `SELECT COUNT(*) as count FROM ${tableName} WHERE sheet = '${sheetName}'`
      );
      const rowCount = rowCountQuery.rows[0].count;

      // Get columns (excluding 'sheet' column)
      const columns: IColumnMetadata[] = schema
        .filter(col => col.name !== 'sheet')
        .map(col => ({
          name: col.name,
          type: this.normalizeType(col.type),
        }));

      sheets.push({
        name: sheetName,
        rowCount,
        columnCount: columns.length,
        columns,
      });

      totalRows += rowCount;
    }

    return {
      sheets,
      totalRows,
      totalColumns: sheets[0]?.columnCount || 0,
    };
  }

  /**
   * Normalize DuckDB type to simpler type
   */
  private normalizeType(duckdbType: string): string {
    const type = duckdbType.toUpperCase();

    if (type.includes('INT')) return 'integer';
    if (type.includes('DOUBLE') || type.includes('FLOAT') || type.includes('DECIMAL')) return 'decimal';
    if (type.includes('DATE')) return 'date';
    if (type.includes('TIMESTAMP')) return 'timestamp';
    if (type.includes('BOOL')) return 'boolean';
    if (type.includes('VARCHAR') || type.includes('TEXT')) return 'varchar';

    return 'varchar'; // Default
  }

  /**
   * Export table to Parquet
   */
  private async exportToParquet(
    tableName: string,
    outputPath: string,
    metadata: ISessionMetadata
  ): Promise<void> {
    console.log(`[ParquetConverter] Exporting to Parquet: ${outputPath}`);

    const sql = `SELECT * FROM ${tableName}`;
    await this.client.exportToParquet(sql, outputPath);
  }

  /**
   * Calculate SHA-256 hash of file
   */
  private async calculateFileHash(filePath: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const hash = createHash('sha256');
      const stream = fs.createReadStream(filePath);

      stream.on('data', (data) => hash.update(data));
      stream.on('end', () => resolve(hash.digest('hex')));
      stream.on('error', reject);
    });
  }

  /**
   * Close DuckDB client
   */
  async close(): Promise<void> {
    await this.client.close();
  }
}

/**
 * Create a new Parquet converter instance
 */
export function createParquetConverter(): ParquetConverter {
  return new ParquetConverter();
}
