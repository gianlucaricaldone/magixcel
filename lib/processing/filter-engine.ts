import { IFilter, IFilterGroup, IFilterConfig, FilterOperator } from '@/types';

/**
 * Apply filters to data (supports nested groups)
 */
export function applyFilters(data: any[], config: IFilterConfig, globalSearch?: string): any[] {
  let filteredData = data;

  // Apply global search first
  if (globalSearch && globalSearch.trim()) {
    const searchTerm = globalSearch.toLowerCase();
    filteredData = filteredData.filter((row) => {
      return Object.values(row).some((value) => {
        if (value === null || value === undefined) return false;
        return String(value).toLowerCase().includes(searchTerm);
      });
    });
  }

  // Apply specific filters
  if (!config.filters || config.filters.length === 0) {
    return filteredData;
  }

  return filteredData.filter((row) => {
    return evaluateFilterList(row, config.filters, config.combinator);
  });
}

/**
 * Evaluate a list of filters (can include groups)
 */
function evaluateFilterList(
  row: any,
  filters: (IFilter | IFilterGroup)[],
  combinator: 'AND' | 'OR'
): boolean {
  if (filters.length === 0) return true;

  const results = filters.map((item) => {
    if ('type' in item && item.type === 'group') {
      // It's a group - evaluate recursively
      return evaluateFilterList(row, item.filters, item.combinator);
    } else {
      // It's a filter - match directly
      return matchFilter(row, item as IFilter);
    }
  });

  // Combine results based on combinator
  if (combinator === 'AND') {
    return results.every((r) => r);
  } else {
    return results.some((r) => r);
  }
}

/**
 * Check if a row matches a single filter
 */
function matchFilter(row: any, filter: IFilter): boolean {
  const value = row[filter.column];
  const filterValue = filter.value;

  switch (filter.operator) {
    case 'equals':
      return value == filterValue; // Loose equality for type coercion

    case 'notEquals':
      return value != filterValue;

    case 'contains':
      return String(value).toLowerCase().includes(String(filterValue).toLowerCase());

    case 'notContains':
      return !String(value).toLowerCase().includes(String(filterValue).toLowerCase());

    case 'startsWith':
      return String(value).toLowerCase().startsWith(String(filterValue).toLowerCase());

    case 'endsWith':
      return String(value).toLowerCase().endsWith(String(filterValue).toLowerCase());

    case 'greaterThan':
      return Number(value) > Number(filterValue);

    case 'greaterThanOrEquals':
      return Number(value) >= Number(filterValue);

    case 'lessThan':
      return Number(value) < Number(filterValue);

    case 'lessThanOrEquals':
      return Number(value) <= Number(filterValue);

    case 'between':
      const num = Number(value);
      return num >= Number(filterValue) && num <= Number(filter.value2);

    case 'in':
      const inArray = Array.isArray(filterValue) ? filterValue : [filterValue];
      return inArray.includes(value);

    case 'notIn':
      const notInArray = Array.isArray(filterValue) ? filterValue : [filterValue];
      return !notInArray.includes(value);

    case 'isNull':
      return value === null || value === undefined || value === '';

    case 'isNotNull':
      return value !== null && value !== undefined && value !== '';

    case 'regex':
      try {
        const regex = new RegExp(String(filterValue), 'i');
        return regex.test(String(value));
      } catch (error) {
        console.error('Invalid regex:', filterValue);
        return false;
      }

    default:
      return false;
  }
}

/**
 * Generate a hash for a filter configuration (for caching)
 */
export function generateFilterHash(config: IFilterConfig): string {
  const str = JSON.stringify(config);
  let hash = 0;

  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }

  return Math.abs(hash).toString(36);
}

/**
 * Validate filter configuration
 */
export function validateFilterConfig(config: IFilterConfig): { valid: boolean; error?: string } {
  if (!config.filters || !Array.isArray(config.filters)) {
    return { valid: false, error: 'Filters must be an array' };
  }

  if (!['AND', 'OR'].includes(config.combinator)) {
    return { valid: false, error: 'Combinator must be AND or OR' };
  }

  for (const item of config.filters) {
    if ('type' in item && item.type === 'group') {
      // Validate group recursively
      const groupValid = validateFilterConfig({
        filters: item.filters,
        combinator: item.combinator,
      });
      if (!groupValid.valid) return groupValid;
    } else {
      // Validate filter
      const filter = item as IFilter;
      if (!filter.column || typeof filter.column !== 'string') {
        return { valid: false, error: 'Each filter must have a column name' };
      }

      if (!filter.operator) {
        return { valid: false, error: 'Each filter must have an operator' };
      }

      if (filter.operator === 'between' && (filter.value === undefined || filter.value2 === undefined)) {
        return { valid: false, error: 'Between operator requires both value and value2' };
      }

      if (!['isNull', 'isNotNull'].includes(filter.operator) && filter.value === undefined) {
        return { valid: false, error: `Filter operator ${filter.operator} requires a value` };
      }
    }
  }

  return { valid: true };
}
