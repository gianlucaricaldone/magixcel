/**
 * Filter type definitions
 */

export type FilterOperator =
  | 'equals'
  | 'notEquals'
  | 'contains'
  | 'notContains'
  | 'startsWith'
  | 'endsWith'
  | 'greaterThan'
  | 'greaterThanOrEquals'
  | 'lessThan'
  | 'lessThanOrEquals'
  | 'between'
  | 'in'
  | 'notIn'
  | 'isNull'
  | 'isNotNull'
  | 'regex';

export type FilterCombinator = 'AND' | 'OR';

export interface IFilter {
  id: string;
  column: string;
  operator: FilterOperator;
  value: any;
  value2?: any; // For 'between' operator
}

// Filter group for nested conditions
export interface IFilterGroup {
  id: string;
  type: 'group';
  combinator: FilterCombinator;
  filters: (IFilter | IFilterGroup)[];
}

// Top level filter configuration
export interface IFilterConfig {
  filters: (IFilter | IFilterGroup)[];
  combinator: FilterCombinator;
}

export interface IColumnType {
  name: string;
  type: 'string' | 'number' | 'date' | 'boolean' | 'unknown';
  uniqueValues?: number;
  nullCount?: number;
  min?: any;
  max?: any;
  avg?: number;
}
