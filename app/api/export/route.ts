/**
 * Export API Route (Refactored)
 *
 * Exports data from Parquet files using DuckDB
 * Supports CSV and JSON formats
 */

import { NextRequest, NextResponse } from 'next/server';
import { getDBAdapter, getCurrentUserId } from '@/lib/adapters/db/factory';
import { getStorageAdapter } from '@/lib/adapters/storage/factory';
import { getCacheAdapter } from '@/lib/adapters/cache/factory';
import { CacheKeys } from '@/lib/adapters/cache/interface';
import { createDuckDBClient } from '@/lib/duckdb/client';
import { createQueryBuilder } from '@/lib/duckdb/query-builder';
import { LocalStorageAdapter } from '@/lib/adapters/storage/local';
import { ERROR_CODES } from '@/lib/utils/constants';
import Papa from 'papaparse';

export async function POST(request: NextRequest) {
  const duckdb = createDuckDBClient();

  try {
    const db = getDBAdapter();
    const storage = getStorageAdapter();
    const cache = getCacheAdapter();
    const userId = getCurrentUserId();

    const body = await request.json();
    const {
      sessionId,
      sheetName = null,
      filters = [],
      combinator = 'AND',
      globalSearch = '',
      format = 'csv',
      options = {},
    } = body;

    if (!sessionId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: ERROR_CODES.VALIDATION_ERROR,
            message: 'Session ID is required',
          },
        },
        { status: 400 }
      );
    }

    // Validate session
    const session = await db.getSession(sessionId, userId);
    if (!session) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: ERROR_CODES.SESSION_NOT_FOUND,
            message: 'Session not found',
          },
        },
        { status: 404 }
      );
    }

    // Check if Parquet path exists
    if (!session.r2_path_parquet) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: ERROR_CODES.PROCESSING_ERROR,
            message: 'Parquet file not available for this session',
          },
        },
        { status: 500 }
      );
    }

    let data: any[];

    // Check cache if filters provided
    if (filters.length > 0 || globalSearch) {
      const filterHash = JSON.stringify({ filters, combinator, globalSearch });
      const cacheKey = CacheKeys.filterQuery(sessionId, filterHash, 1);
      const cached = await cache.get(cacheKey);

      if (cached) {
        console.log('[Export] Using cached filtered data');
        data = cached.data || [];
      } else {
        // Query with filters using DuckDB
        console.log('[Export] Querying Parquet with filters');

        // Get absolute path to Parquet file
        let parquetPath: string;
        if (storage instanceof LocalStorageAdapter) {
          parquetPath = storage.getAbsolutePath(session.r2_path_parquet);
        } else {
          parquetPath = await storage.getPublicUrl(session.r2_path_parquet);
        }

        await duckdb.connect();

        const queryBuilder = createQueryBuilder({
          sessionId,
          sheetName,
          parquetPath,
        });

        // Build query without pagination (export all filtered data)
        const query = queryBuilder.buildQuery({
          filters,
          combinator,
          globalSearch,
          sortBy: undefined,
          columns: ['*'],
          pagination: undefined, // No pagination for export
        });

        const result = await duckdb.query(query);
        data = result.rows;

        await duckdb.close();
      }
    } else {
      // No filters - export all data
      console.log('[Export] Querying all data from Parquet');

      let parquetPath: string;
      if (storage instanceof LocalStorageAdapter) {
        parquetPath = storage.getAbsolutePath(session.r2_path_parquet);
      } else {
        parquetPath = await storage.getPublicUrl(session.r2_path_parquet);
      }

      await duckdb.connect();

      let query = `SELECT * FROM read_parquet('${parquetPath}')`;
      if (sheetName) {
        query += ` WHERE sheet = '${sheetName.replace(/'/g, "''")}'`;
      }

      const result = await duckdb.query(query);
      data = result.rows;

      await duckdb.close();
    }

    console.log(`[Export] Exporting ${data.length} rows as ${format}`);

    // Export based on format
    if (format === 'csv') {
      const csv = Papa.unparse(data, {
        header: options.includeHeaders !== false,
        delimiter: options.delimiter || ',',
      });

      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="export-${Date.now()}.csv"`,
        },
      });
    } else if (format === 'json') {
      return new NextResponse(JSON.stringify(data, null, 2), {
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="export-${Date.now()}.json"`,
        },
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: ERROR_CODES.VALIDATION_ERROR,
            message: `Unsupported export format: ${format}`,
          },
        },
        { status: 400 }
      );
    }

  } catch (error: any) {
    console.error('[Export] Error:', error);

    // Ensure DuckDB connection is closed
    try {
      await duckdb.close();
    } catch (closeError) {
      console.error('[Export] Close error:', closeError);
    }

    return NextResponse.json(
      {
        success: false,
        error: {
          code: ERROR_CODES.EXPORT_FAILED,
          message: error.message || 'Failed to export data',
          details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
        },
      },
      { status: 500 }
    );
  }
}
