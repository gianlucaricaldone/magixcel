import { IColumnType } from '@/types';

/**
 * Infer the data type of a column based on its values
 */
export function inferColumnType(columnName: string, values: any[]): IColumnType {
  const nonNullValues = values.filter((v) => v !== null && v !== undefined && v !== '');

  if (nonNullValues.length === 0) {
    return {
      name: columnName,
      type: 'unknown',
      nullCount: values.length,
    };
  }

  const types = {
    number: 0,
    string: 0,
    date: 0,
    boolean: 0,
  };

  nonNullValues.forEach((value) => {
    if (typeof value === 'boolean') {
      types.boolean++;
    } else if (typeof value === 'number') {
      types.number++;
    } else if (value instanceof Date) {
      types.date++;
    } else if (typeof value === 'string') {
      // Check if it's a date string
      if (isDateString(value)) {
        types.date++;
      } else {
        types.string++;
      }
    } else {
      types.string++;
    }
  });

  // Determine dominant type (>80% threshold)
  const total = nonNullValues.length;
  const threshold = 0.8;

  let dominantType: 'string' | 'number' | 'date' | 'boolean' | 'unknown' = 'unknown';

  if (types.boolean / total > threshold) {
    dominantType = 'boolean';
  } else if (types.number / total > threshold) {
    dominantType = 'number';
  } else if (types.date / total > threshold) {
    dominantType = 'date';
  } else if (types.string / total > threshold) {
    dominantType = 'string';
  } else {
    dominantType = 'string'; // Default to string for mixed types
  }

  // Calculate statistics based on type
  const result: IColumnType = {
    name: columnName,
    type: dominantType,
    uniqueValues: new Set(nonNullValues).size,
    nullCount: values.length - nonNullValues.length,
  };

  if (dominantType === 'number') {
    const numbers = nonNullValues.map((v) => (typeof v === 'number' ? v : Number(v)));
    result.min = Math.min(...numbers);
    result.max = Math.max(...numbers);
    result.avg = numbers.reduce((a, b) => a + b, 0) / numbers.length;
  }

  if (dominantType === 'date') {
    const dates = nonNullValues.map((v) => (v instanceof Date ? v : new Date(v)));
    result.min = new Date(Math.min(...dates.map((d) => d.getTime())));
    result.max = new Date(Math.max(...dates.map((d) => d.getTime())));
  }

  if (dominantType === 'string') {
    const lengths = nonNullValues.map((v) => String(v).length);
    result.min = Math.min(...lengths);
    result.max = Math.max(...lengths);
  }

  return result;
}

/**
 * Check if a string looks like a date
 */
function isDateString(value: string): boolean {
  // Common date patterns
  const datePatterns = [
    /^\d{4}-\d{2}-\d{2}/, // ISO date
    /^\d{2}\/\d{2}\/\d{4}/, // US date
    /^\d{2}-\d{2}-\d{4}/, // European date
  ];

  if (datePatterns.some((pattern) => pattern.test(value))) {
    const date = new Date(value);
    return !isNaN(date.getTime());
  }

  return false;
}
