'use client';

import { useState, useEffect } from 'react';
import { Save, FolderOpen, Trash2, Edit2, Check, X, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useFilterStore } from '@/stores/filter-store';
import { IFilterPreset } from '@/types/database';

export function FilterPresets() {
  const {
    presets,
    presetsLoading,
    loadPresets,
    savePreset,
    loadPreset,
    updatePreset,
    deletePreset,
    getFilterConfig,
  } = useFilterStore();

  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showLoadDialog, setShowLoadDialog] = useState(false);
  const [editingPresetId, setEditingPresetId] = useState<string | null>(null);

  // Save preset form state
  const [saveName, setSaveName] = useState('');
  const [saveDescription, setSaveDescription] = useState('');
  const [saveCategory, setSaveCategory] = useState('Custom');
  const [saveError, setSaveError] = useState('');

  // Edit preset form state
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editCategory, setEditCategory] = useState('');

  // Load presets on mount
  useEffect(() => {
    loadPresets();
  }, []);

  const handleSavePreset = async () => {
    if (!saveName.trim()) {
      setSaveError('Name is required');
      return;
    }

    const result = await savePreset(saveName, saveDescription, saveCategory);

    if (result.success) {
      // Reset form and close dialog
      setSaveName('');
      setSaveDescription('');
      setSaveCategory('Custom');
      setSaveError('');
      setShowSaveDialog(false);
    } else {
      setSaveError(result.error || 'Failed to save preset');
    }
  };

  const handleLoadPreset = async (id: string) => {
    await loadPreset(id);
    setShowLoadDialog(false);
  };

  const handleStartEdit = (preset: IFilterPreset) => {
    setEditingPresetId(preset.id);
    setEditName(preset.name);
    setEditDescription(preset.description || '');
    setEditCategory(preset.category);
  };

  const handleSaveEdit = async () => {
    if (!editingPresetId) return;

    await updatePreset(editingPresetId, {
      name: editName,
      description: editDescription,
      category: editCategory,
    });

    setEditingPresetId(null);
  };

  const handleCancelEdit = () => {
    setEditingPresetId(null);
    setEditName('');
    setEditDescription('');
    setEditCategory('');
  };

  const handleDeletePreset = async (id: string) => {
    if (confirm('Are you sure you want to delete this preset?')) {
      await deletePreset(id);
    }
  };

  const handleUpdateFilters = async (id: string, presetName: string) => {
    if (confirm(`Update "${presetName}" with current filters?`)) {
      const currentFilters = getFilterConfig();
      await updatePreset(id, {
        filterConfig: currentFilters,
      });
    }
  };

  // Group presets by category
  const presetsByCategory = presets.reduce((acc, preset) => {
    const cat = preset.category || 'Custom';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(preset);
    return acc;
  }, {} as Record<string, IFilterPreset[]>);

  return (
    <>
      {/* Action Buttons - Compact Row */}
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowSaveDialog(true)}
          className="flex items-center gap-2"
        >
          <Save className="h-4 w-4" />
          Save Preset
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowLoadDialog(true)}
          className="flex items-center gap-2"
        >
          <FolderOpen className="h-4 w-4" />
          Load Preset
          {presets.length > 0 && (
            <span className="ml-1 px-1.5 py-0.5 text-xs bg-blue-100 text-blue-700 rounded-full">
              {presets.length}
            </span>
          )}
        </Button>
      </div>

      {/* Save Preset Dialog */}
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Save Current Filters as Preset</DialogTitle>
            <DialogDescription>
              Create a reusable preset from your current filter configuration.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Name *</label>
              <input
                type="text"
                value={saveName}
                onChange={(e) => setSaveName(e.target.value)}
                placeholder="e.g., Active Customers"
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <input
                type="text"
                value={saveDescription}
                onChange={(e) => setSaveDescription(e.target.value)}
                placeholder="Optional description"
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Category</label>
              <input
                type="text"
                value={saveCategory}
                onChange={(e) => setSaveCategory(e.target.value)}
                placeholder="e.g., Sales, Finance"
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {saveError && (
              <p className="text-sm text-red-600">{saveError}</p>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowSaveDialog(false);
                setSaveError('');
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleSavePreset}>
              Save Preset
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Load Preset Dialog */}
      <Dialog open={showLoadDialog} onOpenChange={setShowLoadDialog}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Load Saved Preset</DialogTitle>
            <DialogDescription>
              Apply a saved filter configuration to your current data.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto py-4">
            {presetsLoading ? (
              <p className="text-sm text-muted-foreground text-center py-8">Loading presets...</p>
            ) : presets.length === 0 ? (
              <div className="text-center py-8">
                <FolderOpen className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground">No presets saved yet</p>
                <p className="text-xs text-muted-foreground mt-1">Create filters and click "Save Preset" to get started</p>
              </div>
            ) : (
              <div className="space-y-6">
                {Object.entries(presetsByCategory).map(([category, categoryPresets]) => (
                  <div key={category}>
                    <h4 className="text-sm font-semibold text-blue-600 mb-3 flex items-center gap-2">
                      <div className="h-px flex-1 bg-blue-200"></div>
                      <span>{category}</span>
                      <div className="h-px flex-1 bg-blue-200"></div>
                    </h4>
                    <div className="space-y-2">
                      {categoryPresets.map((preset) => (
                        <div
                          key={preset.id}
                          className="p-3 bg-slate-50 border rounded-md hover:border-blue-300 hover:bg-blue-50/50 transition-all"
                        >
                          {editingPresetId === preset.id ? (
                            // Edit Mode
                            <div className="space-y-2">
                              <input
                                type="text"
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                className="w-full px-2 py-1 border rounded text-sm font-medium"
                              />
                              <input
                                type="text"
                                value={editDescription}
                                onChange={(e) => setEditDescription(e.target.value)}
                                placeholder="Description"
                                className="w-full px-2 py-1 border rounded text-xs"
                              />
                              <input
                                type="text"
                                value={editCategory}
                                onChange={(e) => setEditCategory(e.target.value)}
                                placeholder="Category"
                                className="w-full px-2 py-1 border rounded text-xs"
                              />
                              <div className="flex gap-2 pt-1">
                                <button
                                  onClick={handleSaveEdit}
                                  className="flex items-center gap-1 px-2 py-1 text-xs text-green-700 bg-green-50 hover:bg-green-100 rounded"
                                >
                                  <Check className="h-3 w-3" />
                                  Save
                                </button>
                                <button
                                  onClick={handleCancelEdit}
                                  className="flex items-center gap-1 px-2 py-1 text-xs text-gray-700 bg-gray-50 hover:bg-gray-100 rounded"
                                >
                                  <X className="h-3 w-3" />
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            // View Mode
                            <>
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex-1">
                                  <h5 className="text-sm font-semibold text-slate-900">{preset.name}</h5>
                                  {preset.description && (
                                    <p className="text-xs text-muted-foreground mt-0.5">{preset.description}</p>
                                  )}
                                </div>
                                <div className="flex gap-1 ml-2">
                                  <button
                                    onClick={() => handleUpdateFilters(preset.id, preset.name)}
                                    className="p-1.5 text-green-600 hover:bg-green-100 rounded transition-colors"
                                    title="Update with current filters"
                                  >
                                    <RefreshCw className="h-3.5 w-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleStartEdit(preset)}
                                    className="p-1.5 text-blue-600 hover:bg-blue-100 rounded transition-colors"
                                    title="Edit name/description/category"
                                  >
                                    <Edit2 className="h-3.5 w-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleDeletePreset(preset.id)}
                                    className="p-1.5 text-red-600 hover:bg-red-100 rounded transition-colors"
                                    title="Delete preset"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  onClick={() => handleLoadPreset(preset.id)}
                                  className="flex-1 h-8 text-xs"
                                >
                                  Apply Preset
                                </Button>
                              </div>
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <DialogFooter className="border-t pt-4">
            <Button variant="outline" onClick={() => setShowLoadDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
