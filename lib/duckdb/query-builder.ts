/**
 * DuckDB Query Builder
 *
 * Converts FilterConfig to optimized SQL queries
 * Handles filtering, sorting, pagination, global search
 */

import { createHash } from 'crypto';
import { IFilter, FilterOperator, IFilterConfig } from '../adapters/db/interface';

export interface IQueryBuilderConfig {
  sessionId: string;
  sheetName?: string | null;
  parquetPath: string;
}

export interface IFilterQueryOptions {
  filters?: IFilter[];
  combinator?: 'AND' | 'OR';
  globalSearch?: string;
  sortBy?: {
    column: string;
    direction: 'asc' | 'desc';
  };
  pagination?: {
    page: number;
    pageSize: number;
  };
  columns?: string[]; // Select specific columns (optional, defaults to *)
}

export class DuckDBQueryBuilder {
  private sessionId: string;
  private sheetName: string | null;
  private parquetPath: string;
  private availableColumns: string[] = [];

  constructor(config: IQueryBuilderConfig) {
    this.sessionId = config.sessionId;
    this.sheetName = config.sheetName || null;
    this.parquetPath = config.parquetPath;
  }

  /**
   * Set available columns for this session/sheet
   * Used for global search and validation
   */
  setAvailableColumns(columns: string[]): void {
    this.availableColumns = columns;
  }

  /**
   * Build SELECT query from filter options
   */
  buildQuery(options: IFilterQueryOptions): string {
    const {
      filters = [],
      combinator = 'AND',
      globalSearch,
      sortBy,
      pagination,
      columns,
    } = options;

    // Build SELECT clause
    const selectClause = columns && columns.length > 0
      ? columns.map(col => this.escapeIdentifier(col)).join(', ')
      : '*';

    let sql = `SELECT ${selectClause} FROM read_parquet('${this.parquetPath}')`;

    // Build WHERE clause
    const conditions: string[] = [];

    // Sheet filter (for multi-sheet Excel files)
    if (this.sheetName) {
      conditions.push(`sheet = ${this.escapeValue(this.sheetName)}`);
    }

    // Specific filters
    if (filters.length > 0) {
      const filterSQL = this.buildFilterSQL(filters, combinator);
      conditions.push(`(${filterSQL})`);
    }

    // Global search across all columns
    if (globalSearch) {
      const searchSQL = this.buildGlobalSearchSQL(globalSearch);
      if (searchSQL) {
        conditions.push(`(${searchSQL})`);
      }
    }

    if (conditions.length > 0) {
      sql += ` WHERE ${conditions.join(' AND ')}`;
    }

    // Add ORDER BY
    if (sortBy) {
      sql += ` ORDER BY ${this.escapeIdentifier(sortBy.column)} ${sortBy.direction.toUpperCase()}`;
    }

    // Add pagination
    if (pagination) {
      const offset = (pagination.page - 1) * pagination.pageSize;
      sql += ` LIMIT ${pagination.pageSize} OFFSET ${offset}`;
    }

    return sql;
  }

  /**
   * Build COUNT query (for pagination)
   */
  buildCountQuery(options: Omit<IFilterQueryOptions, 'sortBy' | 'pagination'>): string {
    const baseQuery = this.buildQuery({
      ...options,
      sortBy: undefined, // No sorting needed for count
      pagination: undefined, // No pagination for count
    });

    return `SELECT COUNT(*) as total FROM (${baseQuery}) AS filtered`;
  }

  /**
   * Build statistics query for numeric columns
   */
  buildStatsQuery(columns: string[]): string {
    const statsSelects = columns.map(col => {
      const escaped = this.escapeIdentifier(col);
      return `
        MIN(${escaped}) as ${col}_min,
        MAX(${escaped}) as ${col}_max,
        AVG(${escaped}) as ${col}_avg,
        MEDIAN(${escaped}) as ${col}_median,
        STDDEV(${escaped}) as ${col}_stddev,
        SUM(${escaped}) as ${col}_sum,
        COUNT(${escaped}) as ${col}_count
      `.trim();
    }).join(',\n');

    let sql = `SELECT ${statsSelects} FROM read_parquet('${this.parquetPath}')`;

    if (this.sheetName) {
      sql += ` WHERE sheet = ${this.escapeValue(this.sheetName)}`;
    }

    return sql;
  }

  /**
   * Build filter conditions recursively
   */
  private buildFilterSQL(filters: IFilter[], combinator: 'AND' | 'OR'): string {
    const conditions = filters.map(filter => this.buildSingleFilterSQL(filter));
    return conditions.join(` ${combinator} `);
  }

  /**
   * Build single filter condition
   */
  private buildSingleFilterSQL(filter: IFilter): string {
    const { column, operator, value, value2 } = filter;
    const col = this.escapeIdentifier(column);

    switch (operator) {
      case 'equals':
        return `${col} = ${this.escapeValue(value)}`;

      case 'notEquals':
        return `${col} != ${this.escapeValue(value)}`;

      case 'contains':
        return `LOWER(CAST(${col} AS VARCHAR)) LIKE LOWER(${this.escapeValue(`%${value}%`)})`;

      case 'notContains':
        return `LOWER(CAST(${col} AS VARCHAR)) NOT LIKE LOWER(${this.escapeValue(`%${value}%`)})`;

      case 'greaterThan':
        return `${col} > ${this.escapeValue(value)}`;

      case 'lessThan':
        return `${col} < ${this.escapeValue(value)}`;

      case 'greaterThanOrEqual':
        return `${col} >= ${this.escapeValue(value)}`;

      case 'lessThanOrEqual':
        return `${col} <= ${this.escapeValue(value)}`;

      case 'between':
        return `${col} BETWEEN ${this.escapeValue(value)} AND ${this.escapeValue(value2)}`;

      case 'in':
        const values = Array.isArray(value) ? value : [value];
        const escapedValues = values.map(v => this.escapeValue(v)).join(', ');
        return `${col} IN (${escapedValues})`;

      case 'notIn':
        const notValues = Array.isArray(value) ? value : [value];
        const escapedNotValues = notValues.map(v => this.escapeValue(v)).join(', ');
        return `${col} NOT IN (${escapedNotValues})`;

      case 'isNull':
        return `${col} IS NULL`;

      case 'isNotNull':
        return `${col} IS NOT NULL`;

      case 'startsWith':
        return `LOWER(CAST(${col} AS VARCHAR)) LIKE LOWER(${this.escapeValue(`${value}%`)})`;

      case 'endsWith':
        return `LOWER(CAST(${col} AS VARCHAR)) LIKE LOWER(${this.escapeValue(`%${value}`)})`;

      default:
        throw new Error(`Unknown operator: ${operator}`);
    }
  }

  /**
   * Build global search across all columns
   */
  private buildGlobalSearchSQL(search: string): string {
    if (this.availableColumns.length === 0) {
      console.warn('[QueryBuilder] No columns available for global search');
      return '';
    }

    const conditions = this.availableColumns.map(col => {
      const escaped = this.escapeIdentifier(col);
      return `LOWER(CAST(${escaped} AS VARCHAR)) LIKE LOWER(${this.escapeValue(`%${search}%`)})`;
    });

    return conditions.join(' OR ');
  }

  /**
   * Escape column identifier (prevents SQL injection)
   */
  private escapeIdentifier(identifier: string): string {
    // DuckDB uses double quotes for identifiers
    return `"${identifier.replace(/"/g, '""')}"`;
  }

  /**
   * Escape value (prevents SQL injection)
   */
  private escapeValue(value: any): string {
    if (value === null || value === undefined) {
      return 'NULL';
    }

    if (typeof value === 'string') {
      // Escape single quotes
      return `'${value.replace(/'/g, "''")}'`;
    }

    if (typeof value === 'number' || typeof value === 'boolean') {
      return String(value);
    }

    if (value instanceof Date) {
      return `'${value.toISOString()}'`;
    }

    // For other types, try JSON stringify
    return `'${JSON.stringify(value).replace(/'/g, "''")}'`;
  }

  /**
   * Generate hash for filter configuration (for caching)
   */
  static generateFilterHash(options: IFilterQueryOptions): string {
    const normalized = {
      filters: options.filters?.map(f => ({
        column: f.column,
        operator: f.operator,
        value: f.value,
        value2: f.value2,
      })) || [],
      combinator: options.combinator || 'AND',
      globalSearch: options.globalSearch || '',
      sortBy: options.sortBy || null,
      pagination: options.pagination || null,
    };

    const json = JSON.stringify(normalized);
    return createHash('sha256').update(json).digest('hex');
  }

  /**
   * Validate filter configuration
   * @returns Validation errors, or empty array if valid
   */
  static validateFilters(filters: IFilter[]): string[] {
    const errors: string[] = [];

    for (const filter of filters) {
      // Check required fields
      if (!filter.column) {
        errors.push('Filter must have a column');
      }

      if (!filter.operator) {
        errors.push(`Filter on column "${filter.column}" must have an operator`);
      }

      // Check value is provided (except for isNull/isNotNull)
      if (!['isNull', 'isNotNull'].includes(filter.operator)) {
        if (filter.value === undefined || filter.value === null) {
          errors.push(`Filter on column "${filter.column}" must have a value`);
        }
      }

      // Check value2 for 'between'
      if (filter.operator === 'between') {
        if (filter.value2 === undefined || filter.value2 === null) {
          errors.push(`Filter on column "${filter.column}" with 'between' operator must have value2`);
        }
      }

      // Check array value for 'in' and 'notIn'
      if (['in', 'notIn'].includes(filter.operator)) {
        if (!Array.isArray(filter.value) || filter.value.length === 0) {
          errors.push(`Filter on column "${filter.column}" with '${filter.operator}' operator must have a non-empty array value`);
        }
      }
    }

    return errors;
  }
}

/**
 * Create a new query builder instance
 */
export function createQueryBuilder(config: IQueryBuilderConfig): DuckDBQueryBuilder {
  return new DuckDBQueryBuilder(config);
}
