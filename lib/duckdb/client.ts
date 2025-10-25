/**
 * DuckDB Client Wrapper
 *
 * Manages DuckDB connections and queries
 * Reads Excel/CSV/Parquet files and executes SQL queries
 */

import * as duckdb from 'duckdb';
import { promisify } from 'util';
import fs from 'fs';

export interface IDuckDBQueryResult {
  rows: any[];
  rowCount: number;
  columns: string[];
  executionTime: number;
}

export interface IDuckDBConfig {
  threads?: number;
  memoryLimit?: string;
  tempDirectory?: string;
}

export class DuckDBClient {
  private db: duckdb.Database | null = null;
  private connection: duckdb.Connection | null = null;
  private config: IDuckDBConfig;

  constructor(config?: IDuckDBConfig) {
    this.config = {
      threads: config?.threads || parseInt(process.env.DUCKDB_THREADS || '4'),
      memoryLimit: config?.memoryLimit || process.env.DUCKDB_MEMORY_LIMIT || '2GB',
      tempDirectory: config?.tempDirectory || './data/tmp',
    };

    console.log('[DuckDB] Client initialized with config:', this.config);
  }

  /**
   * Initialize DuckDB connection
   */
  async connect(): Promise<void> {
    if (this.connection) {
      return; // Already connected
    }

    return new Promise((resolve, reject) => {
      console.log('[DuckDB] Creating in-memory database...');

      // Create in-memory database (faster for queries)
      this.db = new duckdb.Database(':memory:', (err) => {
        if (err) {
          console.error('[DuckDB] Database creation failed:', err);
          reject(new Error(`Failed to create DuckDB database: ${err.message}`));
          return;
        }

        console.log('[DuckDB] Database created successfully, getting connection...');

        try {
          // Create connection - connect() returns the connection directly (synchronous)
          this.connection = this.db!.connect();
          console.log('[DuckDB] Connection obtained, type:', typeof this.connection);

          // Set configuration
          console.log('[DuckDB] Starting configuration...');
          this.configureConnection()
            .then(() => {
              console.log('[DuckDB] Configuration promise resolved');
              resolve();
            })
            .catch((err) => {
              console.error('[DuckDB] Configuration failed:', err);
              reject(err);
            });
        } catch (err: any) {
          console.error('[DuckDB] Connection failed:', err);
          reject(new Error(`Failed to connect to DuckDB: ${err.message}`));
        }
      });
    });
  }

  /**
   * Configure DuckDB connection settings
   */
  private async configureConnection(): Promise<void> {
    if (!this.connection) {
      throw new Error('Connection not initialized');
    }

    console.log('[DuckDB] Configuring connection...');

    try {
      // Execute configuration queries directly without promisify
      await new Promise<void>((resolve, reject) => {
        this.connection!.exec(`SET threads TO ${this.config.threads};`, (err) => {
          if (err) reject(err);
          else resolve();
        });
      });
      console.log('[DuckDB] Threads configured');

      await new Promise<void>((resolve, reject) => {
        this.connection!.exec(`SET memory_limit = '${this.config.memoryLimit}';`, (err) => {
          if (err) reject(err);
          else resolve();
        });
      });
      console.log('[DuckDB] Memory limit configured');

      await new Promise<void>((resolve, reject) => {
        this.connection!.exec(`SET enable_progress_bar = false;`, (err) => {
          if (err) reject(err);
          else resolve();
        });
      });
      console.log('[DuckDB] Progress bar configured');

      console.log('[DuckDB] Connection configured successfully');
    } catch (error) {
      console.error('[DuckDB] Configuration error:', error);
      throw error;
    }
  }

  /**
   * Execute SQL query and return results
   */
  async query(sql: string): Promise<IDuckDBQueryResult> {
    if (!this.connection) {
      await this.connect();
    }

    const startTime = Date.now();

    return new Promise((resolve, reject) => {
      this.connection!.all(sql, (err, rows) => {
        if (err) {
          reject(new Error(`DuckDB query error: ${err.message}\nSQL: ${sql}`));
          return;
        }

        const executionTime = Date.now() - startTime;

        // Get column names from first row
        const columns = rows.length > 0 ? Object.keys(rows[0]) : [];

        resolve({
          rows: rows || [],
          rowCount: rows?.length || 0,
          columns,
          executionTime,
        });
      });
    });
  }

  /**
   * Read Excel file and load into DuckDB
   * @param filePath - Path to Excel file
   * @param sheetName - Sheet name (optional, reads first sheet if not specified)
   * @returns Table name
   */
  async loadExcel(filePath: string, sheetName?: string): Promise<string> {
    if (!this.connection) {
      await this.connect();
    }

    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }

    const tableName = 'excel_data';

    let sql: string;
    if (sheetName) {
      sql = `CREATE OR REPLACE TABLE ${tableName} AS SELECT * FROM st_read('${filePath}', layer='${sheetName}');`;
    } else {
      // DuckDB's Excel reader (requires spatial extension)
      // For now, we'll use a simpler approach: read all sheets
      sql = `INSTALL spatial; LOAD spatial; CREATE OR REPLACE TABLE ${tableName} AS SELECT * FROM st_read('${filePath}');`;
    }

    try {
      await this.query(sql);
      console.log(`[DuckDB] Loaded Excel file: ${filePath}`);
      return tableName;
    } catch (error: any) {
      throw new Error(`Failed to load Excel file: ${error.message}`);
    }
  }

  /**
   * Read CSV file and load into DuckDB
   * @param filePath - Path to CSV file
   * @param options - CSV read options
   * @returns Table name
   */
  async loadCSV(
    filePath: string,
    options?: {
      delimiter?: string;
      header?: boolean;
      tableName?: string;
    }
  ): Promise<string> {
    if (!this.connection) {
      await this.connect();
    }

    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }

    const tableName = options?.tableName || 'csv_data';
    const delimiter = options?.delimiter || ',';
    const header = options?.header !== false; // Default true

    const sql = `
      CREATE OR REPLACE TABLE ${tableName} AS
      SELECT * FROM read_csv_auto('${filePath}',
        delim='${delimiter}',
        header=${header},
        auto_detect=true
      );
    `;

    try {
      await this.query(sql);
      console.log(`[DuckDB] Loaded CSV file: ${filePath}`);
      return tableName;
    } catch (error: any) {
      throw new Error(`Failed to load CSV file: ${error.message}`);
    }
  }

  /**
   * Read Parquet file (streaming from disk or URL)
   * Note: DuckDB can query Parquet files directly without loading into memory
   * @param filePath - Path or URL to Parquet file
   * @returns Table name (for subsequent queries)
   */
  async loadParquet(filePath: string): Promise<string> {
    if (!this.connection) {
      await this.connect();
    }

    // Check if file exists (for local files)
    if (!filePath.startsWith('http') && !fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }

    // DuckDB can query Parquet directly - no need to CREATE TABLE
    // Just return a virtual table name that references the file
    console.log(`[DuckDB] Parquet file ready: ${filePath}`);
    return `read_parquet('${filePath}')`;
  }

  /**
   * Export query results to Parquet file
   * @param sql - SQL query
   * @param outputPath - Output Parquet file path
   */
  async exportToParquet(sql: string, outputPath: string): Promise<void> {
    if (!this.connection) {
      await this.connect();
    }

    // Ensure output directory exists
    const dir = outputPath.substring(0, outputPath.lastIndexOf('/'));
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const exportSQL = `COPY (${sql}) TO '${outputPath}' (FORMAT 'parquet', COMPRESSION 'snappy');`;

    try {
      await this.query(exportSQL);
      console.log(`[DuckDB] Exported to Parquet: ${outputPath}`);
    } catch (error: any) {
      throw new Error(`Failed to export to Parquet: ${error.message}`);
    }
  }

  /**
   * Get table schema (columns and types)
   * @param tableName - Table name
   */
  async getSchema(tableName: string): Promise<Array<{ name: string; type: string }>> {
    const sql = `DESCRIBE ${tableName};`;
    const result = await this.query(sql);

    return result.rows.map((row: any) => ({
      name: row.column_name,
      type: row.column_type,
    }));
  }

  /**
   * Get table row count
   * @param tableName - Table name
   */
  async getRowCount(tableName: string): Promise<number> {
    const sql = `SELECT COUNT(*) as count FROM ${tableName};`;
    const result = await this.query(sql);
    // Convert BigInt to Number
    const count = result.rows[0]?.count;
    return count ? Number(count) : 0;
  }

  /**
   * Get table statistics for numeric columns
   * @param tableName - Table name
   * @param columns - Column names (optional, analyzes all numeric columns if not specified)
   */
  async getStatistics(
    tableName: string,
    columns?: string[]
  ): Promise<Record<string, any>> {
    const schema = await this.getSchema(tableName);

    // Filter numeric columns
    const numericColumns = columns
      ? schema.filter((col) => columns.includes(col.name))
      : schema.filter((col) =>
          ['INTEGER', 'BIGINT', 'DOUBLE', 'DECIMAL', 'FLOAT', 'NUMERIC'].some((type) =>
            col.type.toUpperCase().includes(type)
          )
        );

    if (numericColumns.length === 0) {
      return {};
    }

    const stats: Record<string, any> = {};

    for (const col of numericColumns) {
      const sql = `
        SELECT
          MIN(${col.name}) as min,
          MAX(${col.name}) as max,
          AVG(${col.name}) as mean,
          MEDIAN(${col.name}) as median,
          STDDEV(${col.name}) as stddev,
          SUM(${col.name}) as sum,
          COUNT(${col.name}) as count,
          COUNT(*) - COUNT(${col.name}) as null_count
        FROM ${tableName};
      `;

      const result = await this.query(sql);
      stats[col.name] = result.rows[0];
    }

    return stats;
  }

  /**
   * Close connection
   */
  async close(): Promise<void> {
    if (this.connection) {
      return new Promise((resolve, reject) => {
        this.connection!.close((err) => {
          if (err) {
            reject(new Error(`Failed to close DuckDB connection: ${err.message}`));
            return;
          }
          this.connection = null;
          this.db = null;
          console.log('[DuckDB] Connection closed');
          resolve();
        });
      });
    }
  }
}

/**
 * Create a new DuckDB client instance
 */
export function createDuckDBClient(config?: IDuckDBConfig): DuckDBClient {
  return new DuckDBClient(config);
}
