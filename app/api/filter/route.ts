/**
 * Filter API Route (Refactored)
 *
 * Handles data filtering with new architecture:
 * - Queries Parquet files using DuckDB
 * - Uses Query Builder to generate optimized SQL
 * - Caches results using Cache Adapter
 * - Sub-100ms response times for 100k+ row files
 */

import { NextRequest, NextResponse } from 'next/server';
import { getDBAdapter, getCurrentUserId } from '@/lib/adapters/db/factory';
import { getStorageAdapter } from '@/lib/adapters/storage/factory';
import { getCacheAdapter } from '@/lib/adapters/cache/factory';
import { CacheKeys, DEFAULT_CACHE_TTL } from '@/lib/adapters/cache/interface';
import { createDuckDBClient } from '@/lib/duckdb/client';
import { createQueryBuilder, DuckDBQueryBuilder } from '@/lib/duckdb/query-builder';
import { LocalStorageAdapter } from '@/lib/adapters/storage/local';
import { ERROR_CODES, DEFAULT_PAGE_SIZE } from '@/lib/utils/constants';
import { IFilter } from '@/types/database';

export async function POST(request: NextRequest) {
  const duckdb = createDuckDBClient();

  try {
    const db = getDBAdapter();
    const storage = getStorageAdapter();
    const cache = getCacheAdapter();
    const userId = getCurrentUserId();

    // Parse request body
    const body = await request.json();
    const {
      sessionId,
      sheetName = null,
      filters = [],
      combinator = 'AND',
      globalSearch = '',
      sortBy = null,
      pagination = { page: 1, pageSize: DEFAULT_PAGE_SIZE },
    } = body;

    // Validate session ID
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

    // Get session from database
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

    // Validate filters
    const validationErrors = DuckDBQueryBuilder.validateFilters(filters);
    if (validationErrors.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: ERROR_CODES.VALIDATION_ERROR,
            message: 'Invalid filter configuration',
            details: validationErrors,
          },
        },
        { status: 400 }
      );
    }

    // Generate filter hash for caching
    const filterOptions = { filters, combinator, globalSearch, sortBy, pagination };
    const filterHash = DuckDBQueryBuilder.generateFilterHash(filterOptions);

    // Check cache
    const cacheKey = CacheKeys.filterQuery(sessionId, filterHash, pagination.page);
    const cachedResult = await cache.get(cacheKey);

    if (cachedResult) {
      console.log(`[Filter] Cache HIT for ${sessionId}:${filterHash}`);
      return NextResponse.json({
        success: true,
        data: cachedResult,
        cached: true,
        executionTime: 0,
      });
    }

    console.log(`[Filter] Cache MISS for ${sessionId}:${filterHash}`);

    // Get Parquet file path
    let parquetPath: string;
    if (storage instanceof LocalStorageAdapter) {
      // For local storage, get absolute path for DuckDB to read directly
      parquetPath = storage.getAbsolutePath(session.r2_path_parquet);
    } else {
      // For R2, use HTTP URL (DuckDB can read from HTTP)
      parquetPath = await storage.getPublicUrl(session.r2_path_parquet);
    }

    console.log(`[Filter] Querying Parquet: ${parquetPath}`);

    // Build SQL query
    const queryBuilder = createQueryBuilder({
      sessionId: session.id,
      sheetName,
      parquetPath,
    });

    // Set available columns for global search
    const firstSheet = session.metadata.sheets[0];
    if (firstSheet) {
      const columnNames = firstSheet.columns.map(c => c.name);
      queryBuilder.setAvailableColumns(columnNames);
    }

    // Build data query
    const dataQuery = queryBuilder.buildQuery(filterOptions);

    // Build count query (for pagination)
    const countQuery = queryBuilder.buildCountQuery({ filters, combinator, globalSearch });

    console.log(`[Filter] Executing queries...`);
    const startTime = Date.now();

    // Connect to DuckDB
    await duckdb.connect();

    // Execute queries in parallel
    const [dataResult, countResult] = await Promise.all([
      duckdb.query(dataQuery),
      duckdb.query(countQuery),
    ]);

    const executionTime = Date.now() - startTime;

    // Get total row count (unfiltered)
    const totalRows = sheetName
      ? session.metadata.sheets.find(s => s.name === sheetName)?.rowCount || 0
      : session.metadata.totalRows;

    const filteredRows = countResult.rows[0]?.total || 0;

    // Prepare response
    const response = {
      rows: dataResult.rows,
      totalRows,
      filteredRows,
      page: pagination.page,
      pageSize: pagination.pageSize,
      totalPages: Math.ceil(filteredRows / pagination.pageSize),
      executionTime,
      columns: dataResult.columns,
    };

    // Cache the result
    await cache.set(cacheKey, response, DEFAULT_CACHE_TTL.FILTER_QUERY);

    console.log(`[Filter] Query executed in ${executionTime}ms (${filteredRows} / ${totalRows} rows)`);

    // Close DuckDB connection
    await duckdb.close();

    return NextResponse.json({
      success: true,
      data: response,
      cached: false,
      executionTime,
    });

  } catch (error: any) {
    console.error('[Filter] Error:', error);

    // Clean up DuckDB connection
    try {
      await duckdb.close();
    } catch (e) {
      // Ignore cleanup errors
    }

    return NextResponse.json(
      {
        success: false,
        error: {
          code: ERROR_CODES.PROCESSING_ERROR,
          message: error.message || 'Failed to apply filters',
          details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
        },
      },
      { status: 500 }
    );
  }
}
