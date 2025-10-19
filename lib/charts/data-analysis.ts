import { ChartDataAnalysis } from '@/types/charts';
import { isValid, parseISO } from 'date-fns';

/**
 * Analyze dataset to determine column types
 */
export function analyzeData(data: any[], columns: string[]): ChartDataAnalysis {
  if (!data || data.length === 0 || !columns || columns.length === 0) {
    return {
      hasDateColumn: false,
      hasNumericColumn: false,
      dateColumns: [],
      numericColumns: [],
      categoricalColumns: [],
      rowCount: 0,
      columnCount: 0,
    };
  }

  const dateColumns: string[] = [];
  const numericColumns: string[] = [];
  const categoricalColumns: string[] = [];

  columns.forEach((col) => {
    if (isDateColumn(data, col)) {
      dateColumns.push(col);
    } else if (isNumericColumn(data, col)) {
      numericColumns.push(col);
    } else {
      categoricalColumns.push(col);
    }
  });

  return {
    hasDateColumn: dateColumns.length > 0,
    hasNumericColumn: numericColumns.length > 0,
    dateColumns,
    numericColumns,
    categoricalColumns,
    rowCount: data.length,
    columnCount: columns.length,
  };
}

/**
 * Check if a column contains date values
 */
export function isDateColumn(data: any[], column: string): boolean {
  if (!data || data.length === 0) return false;

  // Sample first 10 non-null values
  const samples = data
    .map((row) => row[column])
    .filter((val) => val !== null && val !== undefined && val !== '')
    .slice(0, 10);

  if (samples.length === 0) return false;

  // Check if majority are valid dates
  const validDates = samples.filter((val) => {
    if (typeof val === 'string') {
      // Try to parse as ISO date
      const date = parseISO(val);
      return isValid(date);
    }
    if (val instanceof Date) {
      return isValid(val);
    }
    return false;
  });

  return validDates.length / samples.length >= 0.7;
}

/**
 * Check if a column contains numeric values
 */
export function isNumericColumn(data: any[], column: string): boolean {
  if (!data || data.length === 0) return false;

  // Sample first 10 non-null values
  const samples = data
    .map((row) => row[column])
    .filter((val) => val !== null && val !== undefined && val !== '')
    .slice(0, 10);

  if (samples.length === 0) return false;

  // Check if majority are numbers
  const validNumbers = samples.filter((val) => {
    if (typeof val === 'number') return true;
    if (typeof val === 'string') {
      const num = parseFloat(val);
      return !isNaN(num) && isFinite(num);
    }
    return false;
  });

  return validNumbers.length / samples.length >= 0.7;
}

/**
 * Check if a column contains categorical values
 */
export function isCategoricalColumn(data: any[], column: string): boolean {
  return !isDateColumn(data, column) && !isNumericColumn(data, column);
}

/**
 * Get unique values from a column
 */
export function getUniqueValues(data: any[], column: string): any[] {
  const uniqueSet = new Set(
    data
      .map((row) => row[column])
      .filter((val) => val !== null && val !== undefined)
  );
  return Array.from(uniqueSet);
}

/**
 * Group data by a column
 */
export function groupBy(data: any[], column: string): Record<string, any[]> {
  return data.reduce((groups, item) => {
    const key = item[column];
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(item);
    return groups;
  }, {} as Record<string, any[]>);
}

/**
 * Aggregate values from an array of items
 */
export function aggregate(
  items: any[],
  field: string,
  method: 'sum' | 'average' | 'count' | 'min' | 'max' | 'none'
): number {
  if (items.length === 0) return 0;

  const values = items
    .map((item) => {
      const val = item[field];
      if (typeof val === 'number') return val;
      if (typeof val === 'string') {
        const num = parseFloat(val);
        return isNaN(num) ? 0 : num;
      }
      return 0;
    })
    .filter((val) => val !== null && val !== undefined);

  switch (method) {
    case 'sum':
      return values.reduce((a, b) => a + b, 0);
    case 'average':
      return values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;
    case 'count':
      return values.length;
    case 'min':
      return values.length > 0 ? Math.min(...values) : 0;
    case 'max':
      return values.length > 0 ? Math.max(...values) : 0;
    case 'none':
      return values[0] || 0;
    default:
      return 0;
  }
}

/**
 * Calculate a suggested target value for gauge charts
 */
export function calculateTarget(data: any[], column: string): number {
  const values = data
    .map((row) => {
      const val = row[column];
      if (typeof val === 'number') return val;
      if (typeof val === 'string') {
        const num = parseFloat(val);
        return isNaN(num) ? 0 : num;
      }
      return 0;
    })
    .filter((val) => val > 0);

  if (values.length === 0) return 100;

  // Target is 120% of current average
  const avg = values.reduce((a, b) => a + b, 0) / values.length;
  return Math.round(avg * 1.2);
}

/**
 * Sample large datasets for performance
 */
export function sampleData(data: any[], maxSize: number): any[] {
  if (data.length <= maxSize) return data;

  const step = Math.floor(data.length / maxSize);
  const sampled: any[] = [];

  for (let i = 0; i < data.length; i += step) {
    sampled.push(data[i]);
    if (sampled.length >= maxSize) break;
  }

  return sampled;
}
