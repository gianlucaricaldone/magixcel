'use client';

import { useState, useEffect } from 'react';
import { Plus, X, Layers, Save, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FilterOperator, IFilter, IFilterGroup, IFilterConfig, FilterCombinator } from '@/types';
import { nanoid } from 'nanoid';

interface ViewFilterEditorProps {
  viewId: string;
  initialFilterConfig: IFilterConfig;
  columns: string[];
  onFiltersChange?: (config: IFilterConfig) => void; // Called on every filter change (live update)
  onSaved?: () => void; // Called after successful save
}

export function ViewFilterEditor({
  viewId,
  initialFilterConfig,
  columns,
  onFiltersChange,
  onSaved,
}: ViewFilterEditorProps) {
  // Local state for filters (NOT global store)
  const [filters, setFilters] = useState<(IFilter | IFilterGroup)[]>(initialFilterConfig.filters || []);
  const [combinator, setCombinator] = useState<FilterCombinator>(initialFilterConfig.combinator || 'AND');
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Reset local state when view changes
  useEffect(() => {
    setFilters(initialFilterConfig.filters || []);
    setCombinator(initialFilterConfig.combinator || 'AND');
    setHasChanges(false);
  }, [viewId, initialFilterConfig]);

  // Emit filter changes to parent (for live filtering)
  useEffect(() => {
    if (onFiltersChange) {
      onFiltersChange({ filters, combinator });
    }
  }, [filters, combinator, onFiltersChange]);

  const operators: FilterOperator[] = [
    'equals',
    'notEquals',
    'contains',
    'notContains',
    'startsWith',
    'endsWith',
    'greaterThan',
    'greaterThanOrEqual',
    'lessThan',
    'lessThanOrEqual',
    'isNull',
    'isNotNull',
  ];

  // Add filter (to root or to a group)
  const addFilter = (filterData: Omit<IFilter, 'id'>, groupId?: string) => {
    const newFilter: IFilter = {
      id: nanoid(),
      ...filterData,
    };

    if (groupId) {
      // Add to group
      setFilters(
        filters.map((item) => {
          if ('type' in item && item.type === 'group' && item.id === groupId) {
            return {
              ...item,
              filters: [...item.filters, newFilter],
            };
          }
          return item;
        })
      );
    } else {
      // Add to root
      setFilters([...filters, newFilter]);
    }
    setHasChanges(true);
  };

  // Update filter
  const updateFilter = (id: string, updates: Partial<IFilter>) => {
    const updateInArray = (items: (IFilter | IFilterGroup)[]): (IFilter | IFilterGroup)[] => {
      return items.map((item) => {
        if ('type' in item && item.type === 'group') {
          return {
            ...item,
            filters: updateInArray(item.filters),
          };
        } else if (item.id === id) {
          return { ...item, ...updates };
        }
        return item;
      });
    };

    setFilters(updateInArray(filters));
    setHasChanges(true);
  };

  // Remove filter
  const removeFilter = (id: string) => {
    const removeFromArray = (items: (IFilter | IFilterGroup)[]): (IFilter | IFilterGroup)[] => {
      return items
        .filter((item) => item.id !== id)
        .map((item) => {
          if ('type' in item && item.type === 'group') {
            return {
              ...item,
              filters: removeFromArray(item.filters),
            };
          }
          return item;
        });
    };

    setFilters(removeFromArray(filters));
    setHasChanges(true);
  };

  // Add group
  const addGroup = (groupCombinator: FilterCombinator, parentGroupId?: string) => {
    const newGroup: IFilterGroup = {
      id: nanoid(),
      type: 'group',
      combinator: groupCombinator,
      filters: [],
    };

    if (parentGroupId) {
      // Add to parent group
      setFilters(
        filters.map((item) => {
          if ('type' in item && item.type === 'group' && item.id === parentGroupId) {
            return {
              ...item,
              filters: [...item.filters, newGroup],
            };
          }
          return item;
        })
      );
    } else {
      // Add to root
      setFilters([...filters, newGroup]);
    }
    setHasChanges(true);
  };

  // Update group combinator
  const updateGroup = (id: string, newCombinator: FilterCombinator) => {
    const updateInArray = (items: (IFilter | IFilterGroup)[]): (IFilter | IFilterGroup)[] => {
      return items.map((item) => {
        if ('type' in item && item.type === 'group') {
          if (item.id === id) {
            return { ...item, combinator: newCombinator };
          }
          return {
            ...item,
            filters: updateInArray(item.filters),
          };
        }
        return item;
      });
    };

    setFilters(updateInArray(filters));
    setHasChanges(true);
  };

  // Remove group
  const removeGroup = (id: string) => {
    const removeFromArray = (items: (IFilter | IFilterGroup)[]): (IFilter | IFilterGroup)[] => {
      return items
        .filter((item) => !('type' in item && item.type === 'group' && item.id === id))
        .map((item) => {
          if ('type' in item && item.type === 'group') {
            return {
              ...item,
              filters: removeFromArray(item.filters),
            };
          }
          return item;
        });
    };

    setFilters(removeFromArray(filters));
    setHasChanges(true);
  };

  // Save filters to view
  const handleSaveFilters = async () => {
    setIsSaving(true);

    try {
      const response = await fetch(`/api/views/${viewId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filterConfig: {
            filters,
            combinator,
          },
        }),
      });

      const result = await response.json();

      if (result.success) {
        setHasChanges(false);
        if (onSaved) onSaved();
      } else {
        alert(`Errore durante il salvataggio: ${result.error?.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error saving filters:', error);
      alert('Errore durante il salvataggio dei filtri');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Filters Section - Scrollable */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 min-h-0">
        {/* Root Combinator */}
        {filters.length > 1 && (
          <div className="flex gap-2">
            <Button
              size="sm"
              variant={combinator === 'AND' ? 'default' : 'outline'}
              onClick={() => {
                setCombinator('AND');
                setHasChanges(true);
              }}
            >
              AND
            </Button>
            <Button
              size="sm"
              variant={combinator === 'OR' ? 'default' : 'outline'}
              onClick={() => {
                setCombinator('OR');
                setHasChanges(true);
              }}
            >
              OR
            </Button>
          </div>
        )}

        {/* Filters */}
        {filters.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center max-w-md">
              <p className="text-sm text-slate-600 mb-4">Nessun filtro definito</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => addFilter({ column: columns[0], operator: 'contains', value: '' })}
              >
                <Plus className="h-4 w-4 mr-2" />
                Aggiungi Primo Filtro
              </Button>
            </div>
          </div>
        ) : (
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
        )}

        {/* Add Actions */}
        {filters.length > 0 && (
          <div className="flex gap-2 items-center flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={() => addFilter({ column: columns[0], operator: 'contains', value: '' })}
            >
              <Plus className="h-4 w-4 mr-2" />
              Aggiungi Filtro
            </Button>
            <Button variant="outline" size="sm" onClick={() => addGroup('AND')}>
              <Layers className="h-4 w-4 mr-2" />
              Aggiungi Gruppo
            </Button>
          </div>
        )}
      </div>

      {/* Save Button - Fixed at bottom */}
      <div className="flex-shrink-0 border-t bg-white p-2.5">
        <Button
          className="w-full h-9 text-sm"
          onClick={handleSaveFilters}
          disabled={!hasChanges || isSaving}
        >
          {isSaving ? (
            <>
              <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
              Salvataggio...
            </>
          ) : (
            <>
              <Save className="h-3.5 w-3.5 mr-1.5" />
              Salva Filtri View
              {hasChanges && <Badge variant="destructive" className="ml-1.5 text-xs px-1">•</Badge>}
            </>
          )}
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
  updateGroup: (id: string, combinator: FilterCombinator) => void;
  removeGroup: (id: string) => void;
  addFilter: (filter: Omit<IFilter, 'id'>, groupId?: string) => void;
  addGroup: (combinator: FilterCombinator, parentGroupId?: string) => void;
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
        className="flex gap-1.5 items-start bg-white p-2 rounded border"
        style={{ marginLeft: `${level * 8}px` }}
      >
        <div className="flex-1 space-y-1.5 min-w-0">
          {/* Column */}
          <select
            value={filter.column}
            onChange={(e) => {
              updateFilter(filter.id, { column: e.target.value });
            }}
            className="w-full px-2 py-1.5 border rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            {columns.map((col) => (
              <option key={col} value={col}>
                {col}
              </option>
            ))}
          </select>

          {/* Operator */}
          <select
            value={filter.operator}
            onChange={(e) => {
              updateFilter(filter.id, { operator: e.target.value as FilterOperator });
            }}
            className="w-full px-2 py-1.5 border rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            {operators.map((op) => (
              <option key={op} value={op}>
                {op}
              </option>
            ))}
          </select>

          {/* Value */}
          {!['isNull', 'isNotNull'].includes(filter.operator) && (
            <input
              type="text"
              value={filter.value || ''}
              onChange={(e) => {
                updateFilter(filter.id, { value: e.target.value });
              }}
              placeholder="Valore..."
              className="w-full px-2 py-1.5 border rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          )}
        </div>

        <Button
          size="icon"
          variant="ghost"
          onClick={() => removeFilter(filter.id)}
          className="h-7 w-7 flex-shrink-0"
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>
    );
  }
}
