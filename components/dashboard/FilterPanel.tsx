'use client';

import { Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useFilterStore } from '@/stores/filter-store';
import { IFilter, IFilterGroup } from '@/types';

interface FilterPanelProps {
  onOpenFilterBuilder: () => void;
}

export function FilterPanel({ onOpenFilterBuilder }: FilterPanelProps) {
  const {
    clearFilters,
    removeFilter,
    getFilterConfig,
  } = useFilterStore();

  const filterConfig = getFilterConfig();
  const { filters, combinator } = filterConfig;

  const flattenFilters = (items: (IFilter | IFilterGroup)[]): IFilter[] => {
    const result: IFilter[] = [];
    items.forEach((item) => {
      if ('type' in item && item.type === 'group') {
        result.push(...flattenFilters(item.filters));
      } else {
        result.push(item as IFilter);
      }
    });
    return result;
  };

  const activeFilters = flattenFilters(filters);
  const filterCount = activeFilters.length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-900">
          Filtri {filterCount > 0 && `(${filterCount})`}
        </h3>
      </div>

      {/* Active Filters as Chips */}
      {filterCount > 0 ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">
              Active Filters
            </span>
            <button
              onClick={clearFilters}
              className="text-xs text-red-600 hover:text-red-700 font-medium"
            >
              Clear All
            </button>
          </div>

          <div className="space-y-2">
            {activeFilters.map((filter) => (
              <div
                key={filter.id}
                className="flex items-center gap-2 p-2.5 bg-blue-50 border border-blue-200 rounded-md group hover:bg-blue-100 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-blue-900 truncate">
                    {filter.column}
                  </div>
                  <div className="text-xs text-blue-700 truncate">
                    {filter.operator}{' '}
                    {!['isNull', 'isNotNull'].includes(filter.operator) && (
                      <span className="font-medium">{String(filter.value)}</span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => removeFilter(filter.id)}
                  className="flex-shrink-0 p-1 rounded hover:bg-blue-200 transition-colors opacity-70 group-hover:opacity-100"
                  title="Remove filter"
                >
                  <X className="h-3.5 w-3.5 text-blue-700" />
                </button>
              </div>
            ))}
          </div>

          {combinator && filterCount > 1 && (
            <div className="flex items-center justify-center py-2">
              <span className="px-3 py-1 bg-slate-100 rounded-full text-xs font-semibold text-slate-700">
                {combinator}
              </span>
            </div>
          )}
        </div>
      ) : (
        <div className="py-8 text-center">
          <div className="h-12 w-12 mx-auto mb-3 rounded-full bg-slate-100 flex items-center justify-center">
            <Plus className="h-6 w-6 text-slate-400" />
          </div>
          <p className="text-sm text-slate-600 mb-1">No filters applied</p>
          <p className="text-xs text-slate-500">Add filters to start refining your data</p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="pt-2 border-t border-slate-200">
        <Button
          onClick={onOpenFilterBuilder}
          variant="outline"
          size="sm"
          className="w-full justify-start h-9"
        >
          <Plus className="h-4 w-4 mr-2" />
          Gestisci Filtri
        </Button>
      </div>
    </div>
  );
}
