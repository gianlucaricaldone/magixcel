/**
 * Filter type definitions
 *
 * @deprecated Most filter types are now defined in lib/adapters/db/interface.ts
 * This file only contains IColumnType which is not part of the database schema
 */

// Re-export filter types from database layer for backward compatibility
export type {
  FilterOperator,
  FilterCombinator,
  IFilter,
  IFilterGroup,
  IFilterConfig,
} from './database';

// Column type inference (not part of database schema)
export interface IColumnType {
  name: string;
  type: 'string' | 'number' | 'date' | 'boolean' | 'unknown';
  uniqueValues?: number;
  nullCount?: number;
  min?: any;
  max?: any;
  avg?: number;
}
