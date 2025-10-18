import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { storage } from '@/lib/storage';
import { applyFilters, validateFilterConfig, generateFilterHash } from '@/lib/processing/filter-engine';
import { ERROR_CODES, DEFAULT_PAGE_SIZE } from '@/lib/utils/constants';
import { IFilterConfig } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, filters, combinator, pagination, globalSearch } = body;

    if (!sessionId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: ERROR_CODES.SESSION_NOT_FOUND,
            message: 'Session ID is required',
          },
        },
        { status: 400 }
      );
    }

    // Validate session
    const session = await db.getSession(sessionId);
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

    // Validate filter config
    const filterConfig: IFilterConfig = { filters, combinator };
    const validation = validateFilterConfig(filterConfig);
    if (!validation.valid) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: ERROR_CODES.INVALID_FILTER,
            message: validation.error,
          },
        },
        { status: 400 }
      );
    }

    // Generate filter hash for caching
    const filterHash = generateFilterHash(filterConfig);

    // Check cache
    const cached = await db.getCachedResult(sessionId, filterHash);
    if (cached) {
      const cachedData = JSON.parse(cached.result_data);
      return NextResponse.json({
        success: true,
        results: cachedData,
        filterHash,
        cached: true,
      });
    }

    // Load data
    const dataBuffer = await storage.get(`${sessionId}/data.json`);
    const data = JSON.parse(dataBuffer.toString('utf8'));

    // Apply filters
    const filteredData = applyFilters(data, filterConfig, globalSearch);

    // Pagination
    const page = pagination?.page || 1;
    const pageSize = pagination?.pageSize || DEFAULT_PAGE_SIZE;
    const totalPages = Math.ceil(filteredData.length / pageSize);
    const start = (page - 1) * pageSize;
    const paginatedData = filteredData.slice(start, start + pageSize);

    const results = {
      data: paginatedData,
      totalRows: data.length,
      filteredRows: filteredData.length,
      page,
      pageSize,
      totalPages,
    };

    // Cache results
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await db.createCachedResult({
      session_id: sessionId,
      filter_hash: filterHash,
      result_count: filteredData.length,
      result_data: JSON.stringify(results),
      expires_at: expiresAt.toISOString(),
    });

    return NextResponse.json({
      success: true,
      results,
      filterHash,
      cached: false,
    });
  } catch (error: any) {
    console.error('Filter error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: ERROR_CODES.PROCESSING_ERROR,
          message: error.message || 'Failed to apply filters',
        },
      },
      { status: 500 }
    );
  }
}
