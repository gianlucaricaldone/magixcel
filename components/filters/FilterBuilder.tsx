'use client';

import { Plus, X, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useFilterStore } from '@/stores/filter-store';
import { FilterOperator, IFilter, IFilterGroup } from '@/types';
// FilterPresets removed - views are now managed in ViewsTab
// import { FilterPresets } from './FilterPresets';

interface FilterBuilderProps {
  columns: string[];
  data?: any[]; // For preview/compatibility
  onApply?: () => void; // Called when user wants to save the filter
  onCancel?: () => void; // Called when user wants to cancel
}

export function FilterBuilder({ columns, data, onApply, onCancel }: FilterBuilderProps) {
  const {
    addFilter,
    updateFilter,
    removeFilter,
    addGroup,
    updateGroup,
    removeGroup,
    setCombinator,
    getFilterConfig
  } = useFilterStore();

  // Get filters from the active sheet
  const filterConfig = getFilterConfig();
  const { filters, combinator } = filterConfig;

  const operators: FilterOperator[] = [
    'equals',
    'notEquals',
    'contains',
    'greaterThan',
    'lessThan',
    'isNull',
    'isNotNull',
  ];

  // NOTE: Filter application is handled by the session page useEffect
  // No need to apply filters here to avoid infinite loops

  return (
    <div className="space-y-4">
      {/* Filter Presets removed - views are now managed in ViewsTab */}

      {/* Root Combinator */}
      {filters.length > 1 && (
        <div className="flex gap-2">
          <Button
            size="sm"
            variant={combinator === 'AND' ? 'default' : 'outline'}
            onClick={() => setCombinator('AND')}
          >
            AND
          </Button>
          <Button
            size="sm"
            variant={combinator === 'OR' ? 'default' : 'outline'}
            onClick={() => setCombinator('OR')}
          >
            OR
          </Button>
        </div>
      )}

      {/* Filters */}
      <div className="space-y-2">
        {filters.map((item, index) => (
          <FilterItem
            key={item.id}
            item={item}
            columns={columns}
            operators={operators}
            updateFilter={updateFilter}
            removeFilter={removeFilter}
            updateGroup={updateGroup}
            removeGroup={removeGroup}
            addFilter={addFilter}
            addGroup={addGroup}
            isLast={index === filters.length - 1}
            level={0}
          />
        ))}
      </div>

      {/* Actions */}
      <div className="flex gap-2 items-center flex-wrap">
        <Button variant="outline" size="sm" onClick={() => addFilter({ column: columns[0], operator: 'contains', value: '' })}>
          <Plus className="h-4 w-4 mr-2" />
          Aggiungi Filtro
        </Button>
        <Button variant="outline" size="sm" onClick={() => addGroup('AND')}>
          <Layers className="h-4 w-4 mr-2" />
          Aggiungi Gruppo
        </Button>
      </div>
    </div>
  );
}

// Recursive component for rendering filter items
function FilterItem({
  item,
  columns,
  operators,
  updateFilter,
  removeFilter,
  updateGroup,
  removeGroup,
  addFilter,
  addGroup,
  isLast,
  level,
}: {
  item: IFilter | IFilterGroup;
  columns: string[];
  operators: FilterOperator[];
  updateFilter: (id: string, updates: Partial<IFilter>) => void;
  removeFilter: (id: string) => void;
  updateGroup: (id: string, combinator: 'AND' | 'OR') => void;
  removeGroup: (id: string) => void;
  addFilter: (filter: Omit<IFilter, 'id'>, groupId?: string) => void;
  addGroup: (combinator: 'AND' | 'OR', parentGroupId?: string) => void;
  isLast: boolean;
  level: number;
}) {
  if ('type' in item && item.type === 'group') {
    // It's a group
    const group = item as IFilterGroup;

    return (
      <div
        className="border-l-2 border-blue-300 pl-4 space-y-2"
        style={{ marginLeft: `${level * 12}px` }}
      >
        {/* Group Header */}
        <div className="flex gap-2 items-center">
          <span className="text-xs text-blue-600 font-medium">(</span>
          <Button
            size="sm"
            variant={group.combinator === 'AND' ? 'default' : 'outline'}
            onClick={() => updateGroup(group.id, 'AND')}
            className="h-7 text-xs"
          >
            AND
          </Button>
          <Button
            size="sm"
            variant={group.combinator === 'OR' ? 'default' : 'outline'}
            onClick={() => updateGroup(group.id, 'OR')}
            className="h-7 text-xs"
          >
            OR
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => removeGroup(group.id)}
            className="h-7 w-7"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Group Filters */}
        {group.filters.map((childItem, index) => (
          <FilterItem
            key={childItem.id}
            item={childItem}
            columns={columns}
            operators={operators}
            updateFilter={updateFilter}
            removeFilter={removeFilter}
            updateGroup={updateGroup}
            removeGroup={removeGroup}
            addFilter={addFilter}
            addGroup={addGroup}
            isLast={index === group.filters.length - 1}
            level={level + 1}
          />
        ))}

        {/* Add to Group */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => addFilter({ column: columns[0], operator: 'contains', value: '' }, group.id)}
            className="h-7 text-xs"
          >
            <Plus className="h-3 w-3 mr-1" />
            Filter
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => addGroup('AND', group.id)}
            className="h-7 text-xs"
          >
            <Layers className="h-3 w-3 mr-1" />
            Group
          </Button>
        </div>

        <span className="text-xs text-blue-600 font-medium">)</span>
      </div>
    );
  } else {
    // It's a filter
    const filter = item as IFilter;

    return (
      <div
        className="flex gap-2 items-center"
        style={{ marginLeft: `${level * 12}px` }}
      >
        <select
          value={filter.column}
          onChange={(e) => {
            updateFilter(filter.id, { column: e.target.value });
          }}
          className="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
        >
          {columns.map((col) => (
            <option key={col} value={col}>
              {col}
            </option>
          ))}
        </select>

        <select
          value={filter.operator}
          onChange={(e) => {
            updateFilter(filter.id, { operator: e.target.value as FilterOperator });
          }}
          className="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
        >
          {operators.map((op) => (
            <option key={op} value={op}>
              {op}
            </option>
          ))}
        </select>

        {!['isNull', 'isNotNull'].includes(filter.operator) && (
          <input
            type="text"
            value={filter.value || ''}
            onChange={(e) => {
              updateFilter(filter.id, { value: e.target.value });
            }}
            placeholder="Value"
            className="flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
        )}

        <Button
          size="icon"
          variant="ghost"
          onClick={() => removeFilter(filter.id)}
          className="h-9 w-9"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    );
  }
}
