'use client';

import { useState, useEffect } from 'react';
import { Save, FolderOpen, RefreshCw, Trash2, ChevronDown, ChevronRight, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useFilterStore } from '@/stores/filter-store';
import { IView } from '@/types/database';

interface PresetManagerProps {
  onSavePreset: () => void;
}

export function PresetManager({ onSavePreset }: PresetManagerProps) {
  const { views, viewsLoading, loadViews, loadView, updateView, deleteView, getFilterConfig } =
    useFilterStore();

  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['Custom']));

  // Check if there are active filters (works for both single and multi-sheet files)
  const currentFilterConfig = getFilterConfig();
  const hasActiveFilters = currentFilterConfig.filters.length > 0;

  useEffect(() => {
    loadViews();
  }, []);

  const toggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };

  const handleUpdateFilters = async (view: IView) => {
    if (confirm(`Update "${view.name}" with current filters?`)) {
      const currentFilters = getFilterConfig();
      await updateView(view.id, {
        filterConfig: currentFilters,
      });
    }
  };

  const handleDeleteView = async (view: IView) => {
    if (confirm(`Delete view "${view.name}"?`)) {
      await deleteView(view.id);
    }
  };

  // Group views by category
  const viewsByCategory = views.reduce((acc: Record<string, IView[]>, view: IView) => {
    const cat = view.category || 'Custom';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(view);
    return acc;
  }, {} as Record<string, IView[]>);

  const totalViews = views.length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-900">
          Views {totalViews > 0 && `(${totalViews})`}
        </h3>
      </div>

      {/* Info Box - How to create views */}
      {totalViews === 0 && !hasActiveFilters && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-md">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-amber-800">
              <p className="font-semibold mb-1">How to create a view:</p>
              <ol className="list-decimal list-inside space-y-0.5 text-amber-700">
                <li>Go to the <strong>Filters</strong> tab</li>
                <li>Add one or more filters</li>
                <li>Come back here and click <strong>Save Current</strong></li>
              </ol>
            </div>
          </div>
        </div>
      )}

      {/* Save Current Button */}
      <div className="space-y-2">
        <Button
          onClick={onSavePreset}
          variant="default"
          size="sm"
          className="w-full h-9"
          disabled={!hasActiveFilters}
        >
          <Save className="h-4 w-4 mr-2" />
          Save Current Filters
        </Button>
        {hasActiveFilters && (
          <p className="text-xs text-green-600 text-center font-medium">
            ✓ {currentFilterConfig.filters.length} active filter{currentFilterConfig.filters.length !== 1 ? 's' : ''} ready to save
          </p>
        )}
      </div>

      {/* Views Tree */}
      {viewsLoading ? (
        <div className="py-8 text-center">
          <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-solid border-blue-600 border-r-transparent" />
          <p className="text-xs text-slate-600 mt-2">Loading views...</p>
        </div>
      ) : totalViews === 0 ? (
        <div className="py-8 text-center">
          <div className="h-12 w-12 mx-auto mb-3 rounded-full bg-slate-100 flex items-center justify-center">
            <FolderOpen className="h-6 w-6 text-slate-400" />
          </div>
          <p className="text-sm text-slate-600 mb-1 font-medium">No saved views</p>
          <p className="text-xs text-slate-500">Your views will appear here after saving</p>
        </div>
      ) : (
        <div className="space-y-1">
          {Object.entries(viewsByCategory).map(([category, categoryViews]) => {
            const isExpanded = expandedCategories.has(category);

            return (
              <div key={category} className="space-y-1">
                {/* Category Header */}
                <button
                  onClick={() => toggleCategory(category)}
                  className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-slate-100 transition-colors text-left group"
                >
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4 text-slate-500" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-slate-500" />
                  )}
                  <FolderOpen className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium text-slate-700 flex-1">{category}</span>
                  <span className="text-xs text-slate-500">{categoryViews.length}</span>
                </button>

                {/* Category Views */}
                {isExpanded && (
                  <div className="ml-6 space-y-1">
                    {categoryViews.map((view) => (
                      <div
                        key={view.id}
                        className="group p-2 rounded-md hover:bg-blue-50 border border-transparent hover:border-blue-200 transition-all"
                      >
                        {/* View Name & Description */}
                        <div
                          className="cursor-pointer mb-2"
                          onClick={() => loadView(view.id)}
                        >
                          <div className="text-sm font-medium text-slate-900 group-hover:text-blue-700">
                            {view.name}
                          </div>
                          {view.description && (
                            <div className="text-xs text-slate-600 mt-0.5 truncate">
                              {view.description}
                            </div>
                          )}
                        </div>

                        {/* Quick Actions */}
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleUpdateFilters(view)}
                            className="flex-1 flex items-center justify-center gap-1 px-2 py-1 text-xs bg-white hover:bg-green-50 text-green-700 rounded border border-green-200"
                            title="Update with current filters"
                          >
                            <RefreshCw className="h-3 w-3" />
                            Update
                          </button>
                          <button
                            onClick={() => handleDeleteView(view)}
                            className="flex-1 flex items-center justify-center gap-1 px-2 py-1 text-xs bg-white hover:bg-red-50 text-red-700 rounded border border-red-200"
                            title="Delete view"
                          >
                            <Trash2 className="h-3 w-3" />
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Info */}
      {totalViews > 0 && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
          <p className="text-xs text-blue-800">
            <strong>💡 Tip:</strong> Click on a view name to apply it instantly.
          </p>
        </div>
      )}
    </div>
  );
}
