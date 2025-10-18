'use client';

import { useState, useEffect } from 'react';
import { Save, FolderOpen, RefreshCw, Trash2, ChevronDown, ChevronRight, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useFilterStore } from '@/stores/filter-store';
import { IFilterPreset } from '@/types/database';

interface PresetManagerProps {
  onSavePreset: () => void;
}

export function PresetManager({ onSavePreset }: PresetManagerProps) {
  const { presets, presetsLoading, loadPresets, loadPreset, updatePreset, deletePreset, getFilterConfig, filters } =
    useFilterStore();

  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['Custom']));

  // Check if there are active filters
  const hasActiveFilters = filters.length > 0;

  useEffect(() => {
    loadPresets();
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

  const handleUpdateFilters = async (preset: IFilterPreset) => {
    if (confirm(`Update "${preset.name}" with current filters?`)) {
      const currentFilters = getFilterConfig();
      await updatePreset(preset.id, {
        filterConfig: currentFilters,
      });
    }
  };

  const handleDeletePreset = async (preset: IFilterPreset) => {
    if (confirm(`Delete preset "${preset.name}"?`)) {
      await deletePreset(preset.id);
    }
  };

  // Group presets by category
  const presetsByCategory = presets.reduce((acc, preset) => {
    const cat = preset.category || 'Custom';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(preset);
    return acc;
  }, {} as Record<string, IFilterPreset[]>);

  const totalPresets = presets.length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-900">
          Presets {totalPresets > 0 && `(${totalPresets})`}
        </h3>
      </div>

      {/* Info Box - How to create presets */}
      {!hasActiveFilters && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-md">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-amber-800">
              <p className="font-semibold mb-1">Come creare un preset:</p>
              <ol className="list-decimal list-inside space-y-0.5 text-amber-700">
                <li>Vai al tab <strong>Filters</strong></li>
                <li>Aggiungi uno o più filtri</li>
                <li>Torna qui e clicca <strong>Save Current</strong></li>
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
            ✓ {filters.length} filtro{filters.length !== 1 ? 'i' : ''} attivo{filters.length !== 1 ? 'i' : ''} pronto{filters.length !== 1 ? 'i' : ''} da salvare
          </p>
        )}
      </div>

      {/* Presets Tree */}
      {presetsLoading ? (
        <div className="py-8 text-center">
          <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-solid border-blue-600 border-r-transparent" />
          <p className="text-xs text-slate-600 mt-2">Loading presets...</p>
        </div>
      ) : totalPresets === 0 ? (
        <div className="py-8 text-center">
          <div className="h-12 w-12 mx-auto mb-3 rounded-full bg-slate-100 flex items-center justify-center">
            <FolderOpen className="h-6 w-6 text-slate-400" />
          </div>
          <p className="text-sm text-slate-600 mb-1 font-medium">Nessun preset salvato</p>
          <p className="text-xs text-slate-500">I tuoi preset appariranno qui dopo il salvataggio</p>
        </div>
      ) : (
        <div className="space-y-1">
          {Object.entries(presetsByCategory).map(([category, categoryPresets]) => {
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
                  <span className="text-xs text-slate-500">{categoryPresets.length}</span>
                </button>

                {/* Category Presets */}
                {isExpanded && (
                  <div className="ml-6 space-y-1">
                    {categoryPresets.map((preset) => (
                      <div
                        key={preset.id}
                        className="group p-2 rounded-md hover:bg-blue-50 border border-transparent hover:border-blue-200 transition-all"
                      >
                        {/* Preset Name & Description */}
                        <div
                          className="cursor-pointer mb-2"
                          onClick={() => loadPreset(preset.id)}
                        >
                          <div className="text-sm font-medium text-slate-900 group-hover:text-blue-700">
                            {preset.name}
                          </div>
                          {preset.description && (
                            <div className="text-xs text-slate-600 mt-0.5 truncate">
                              {preset.description}
                            </div>
                          )}
                        </div>

                        {/* Quick Actions */}
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleUpdateFilters(preset)}
                            className="flex-1 flex items-center justify-center gap-1 px-2 py-1 text-xs bg-white hover:bg-green-50 text-green-700 rounded border border-green-200"
                            title="Update with current filters"
                          >
                            <RefreshCw className="h-3 w-3" />
                            Update
                          </button>
                          <button
                            onClick={() => handleDeletePreset(preset)}
                            className="flex-1 flex items-center justify-center gap-1 px-2 py-1 text-xs bg-white hover:bg-red-50 text-red-700 rounded border border-red-200"
                            title="Delete preset"
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
      {totalPresets > 0 && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
          <p className="text-xs text-blue-800">
            <strong>💡 Suggerimento:</strong> Clicca sul nome di un preset per applicarlo istantaneamente.
          </p>
        </div>
      )}
    </div>
  );
}
