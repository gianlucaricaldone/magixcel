'use client';

/**
 * @deprecated This component is DEPRECATED and no longer used.
 * Views are now managed in the ViewsTab component with proper workspace/session hierarchy.
 * This file is kept for backward compatibility but should not be imported.
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Save, FolderOpen, Trash2, Edit2, Check, X, RefreshCw, BarChart3 } from 'lucide-react';
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
import { IView } from '@/types/database';

/**
 * @deprecated Use ViewsTab instead
 */
export function FilterPresets() {
  const router = useRouter();
  const {
    views,
    viewsLoading,
    loadViews,
    saveView,
    loadView,
    updateView,
    deleteView,
    getFilterConfig,
  } = useFilterStore();

  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showLoadDialog, setShowLoadDialog] = useState(false);
  const [editingViewId, setEditingViewId] = useState<string | null>(null);

  // Save view form state
  const [saveName, setSaveName] = useState('');
  const [saveDescription, setSaveDescription] = useState('');
  const [saveCategory, setSaveCategory] = useState('Custom');
  const [saveError, setSaveError] = useState('');

  // Edit view form state
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editCategory, setEditCategory] = useState('');

  // Load views on mount
  useEffect(() => {
    loadViews();
  }, []);

  const handleSaveView = async () => {
    if (!saveName.trim()) {
      setSaveError('Name is required');
      return;
    }

    // @ts-ignore - DEPRECATED: This component requires workspace/session which are not available
    const result = await saveView(saveName, {
      description: saveDescription,
      category: saveCategory,
    });

    if (result.success) {
      // Reset form and close dialog
      setSaveName('');
      setSaveDescription('');
      setSaveCategory('Custom');
      setSaveError('');
      setShowSaveDialog(false);
    } else {
      setSaveError(result.error || 'Failed to save view');
    }
  };

  const handleLoadPreset = async (id: string) => {
    await loadView(id);
    setShowLoadDialog(false);
  };

  const handleStartEdit = (view: IView) => {
    setEditingViewId(view.id);
    setEditName(view.name);
    setEditDescription(view.description || '');
    setEditCategory(view.category);
  };

  const handleSaveEdit = async () => {
    if (!editingViewId) return;

    await updateView(editingViewId, {
      name: editName,
      description: editDescription,
      category: editCategory,
    });

    setEditingViewId(null);
  };

  const handleCancelEdit = () => {
    setEditingViewId(null);
    setEditName('');
    setEditDescription('');
    setEditCategory('');
  };

  const handleDeleteView = async (id: string) => {
    if (confirm('Are you sure you want to delete this view?')) {
      await deleteView(id);
    }
  };

  const handleUpdateFilters = async (id: string, viewName: string) => {
    if (confirm(`Update "${viewName}" with current filters?`)) {
      const currentFilters = getFilterConfig();
      await updateView(id, {
        filterConfig: currentFilters,
      });
    }
  };

  // Group views by category
  const viewsByCategory = views.reduce((acc, view) => {
    const cat = view.category || 'Custom';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(view);
    return acc;
  }, {} as Record<string, IView[]>);

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
          Save View
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowLoadDialog(true)}
          className="flex items-center gap-2"
        >
          <FolderOpen className="h-4 w-4" />
          Load View
          {views.length > 0 && (
            <span className="ml-1 px-1.5 py-0.5 text-xs bg-blue-100 text-blue-700 rounded-full">
              {views.length}
            </span>
          )}
        </Button>
      </div>

      {/* Save Preset Dialog */}
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Save Current Filters as View</DialogTitle>
            <DialogDescription>
              Create a reusable view from your current filter configuration.
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
            <Button onClick={handleSaveView}>
              Save View
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Load Preset Dialog */}
      <Dialog open={showLoadDialog} onOpenChange={setShowLoadDialog}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Load Saved View</DialogTitle>
            <DialogDescription>
              Apply a saved filter configuration to your current data.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto py-4">
            {viewsLoading ? (
              <p className="text-sm text-muted-foreground text-center py-8">Loading views...</p>
            ) : views.length === 0 ? (
              <div className="text-center py-8">
                <FolderOpen className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground">No views saved yet</p>
                <p className="text-xs text-muted-foreground mt-1">Create filters and click &quot;Save View&quot; to get started</p>
              </div>
            ) : (
              <div className="space-y-6">
                {Object.entries(viewsByCategory).map(([category, categoryViews]) => (
                  <div key={category}>
                    <h4 className="text-sm font-semibold text-blue-600 mb-3 flex items-center gap-2">
                      <div className="h-px flex-1 bg-blue-200"></div>
                      <span>{category}</span>
                      <div className="h-px flex-1 bg-blue-200"></div>
                    </h4>
                    <div className="space-y-2">
                      {categoryViews.map((view) => (
                        <div
                          key={view.id}
                          className="p-3 bg-slate-50 border rounded-md hover:border-blue-300 hover:bg-blue-50/50 transition-all"
                        >
                          {editingViewId === view.id ? (
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
                                  <h5 className="text-sm font-semibold text-slate-900">{view.name}</h5>
                                  {view.description && (
                                    <p className="text-xs text-muted-foreground mt-0.5">{view.description}</p>
                                  )}
                                </div>
                                <div className="flex gap-1 ml-2">
                                  <button
                                    onClick={() => handleUpdateFilters(view.id, view.name)}
                                    className="p-1.5 text-green-600 hover:bg-green-100 rounded transition-colors"
                                    title="Update with current filters"
                                  >
                                    <RefreshCw className="h-3.5 w-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleStartEdit(view)}
                                    className="p-1.5 text-blue-600 hover:bg-blue-100 rounded transition-colors"
                                    title="Edit name/description/category"
                                  >
                                    <Edit2 className="h-3.5 w-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteView(view.id)}
                                    className="p-1.5 text-red-600 hover:bg-red-100 rounded transition-colors"
                                    title="Delete view"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  onClick={() => handleLoadPreset(view.id)}
                                  className="flex-1 h-8 text-xs"
                                >
                                  Apply View
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => router.push(`/app/view/${view.id}`)}
                                  className="h-8 text-xs"
                                  title="View Dashboard"
                                >
                                  <BarChart3 className="h-4 w-4" />
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
