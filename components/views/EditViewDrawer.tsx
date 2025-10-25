'use client';

import { useState, useEffect, useRef } from 'react';
import { IView } from '@/types/database';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, Check, Loader2, Filter, Trash2 } from 'lucide-react';

interface EditViewDrawerProps {
  view: IView | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateView: (updates: Partial<IView>) => void;
  onDeleteView: () => void;
  onEditFilters: () => void;
}

export function EditViewDrawer({
  view,
  isOpen,
  onClose,
  onUpdateView,
  onDeleteView,
  onEditFilters,
}: EditViewDrawerProps) {
  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [editedDescription, setEditedDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Auto-save timers
  const nameTimerRef = useRef<NodeJS.Timeout | null>(null);
  const descriptionTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Sync local state when view changes
  useEffect(() => {
    if (view) {
      setEditedName(view.name);
      setEditedDescription(view.description || '');
    }
  }, [view]);

  // Auto-save name changes (debounced)
  useEffect(() => {
    if (!isEditingName || !view) return;

    // Clear previous timer
    if (nameTimerRef.current) {
      clearTimeout(nameTimerRef.current);
    }

    // Set new timer for auto-save
    nameTimerRef.current = setTimeout(() => {
      if (editedName.trim() && editedName.trim() !== view.name) {
        setIsSaving(true);
        onUpdateView({ name: editedName.trim() });
        setTimeout(() => setIsSaving(false), 500);
      }
    }, 2000); // Save after 2 seconds of inactivity

    return () => {
      if (nameTimerRef.current) {
        clearTimeout(nameTimerRef.current);
      }
    };
  }, [editedName, isEditingName, view, onUpdateView]);

  // Auto-save description changes (debounced)
  useEffect(() => {
    if (!isEditingDescription || !view) return;

    // Clear previous timer
    if (descriptionTimerRef.current) {
      clearTimeout(descriptionTimerRef.current);
    }

    // Set new timer for auto-save
    descriptionTimerRef.current = setTimeout(() => {
      if (editedDescription !== view.description) {
        setIsSaving(true);
        onUpdateView({ description: editedDescription });
        setTimeout(() => setIsSaving(false), 500);
      }
    }, 2000); // Save after 2 seconds of inactivity

    return () => {
      if (descriptionTimerRef.current) {
        clearTimeout(descriptionTimerRef.current);
      }
    };
  }, [editedDescription, isEditingDescription, view, onUpdateView]);

  const handleSaveName = () => {
    // Clear auto-save timer
    if (nameTimerRef.current) {
      clearTimeout(nameTimerRef.current);
    }

    if (view && editedName.trim() !== view.name) {
      setIsSaving(true);
      onUpdateView({ name: editedName.trim() });
      setTimeout(() => setIsSaving(false), 1000);
    }
    setIsEditingName(false);
  };

  const handleSaveDescription = () => {
    // Clear auto-save timer
    if (descriptionTimerRef.current) {
      clearTimeout(descriptionTimerRef.current);
    }

    if (view && editedDescription !== view.description) {
      setIsSaving(true);
      onUpdateView({ description: editedDescription });
      setTimeout(() => setIsSaving(false), 1000);
    }
    setIsEditingDescription(false);
  };

  const handleDelete = () => {
    if (!view) return;
    if (confirm(`Are you sure you want to delete "${view.name}"?`)) {
      onDeleteView();
      onClose();
    }
  };

  if (!view) return null;

  // filter_config is already deserialized by the adapter
  const filterConfig = view.filter_config || { filters: [], combinator: 'AND' };
  const filterCount = filterConfig.filters?.length || 0;

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-40 transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Drawer */}
      <div
        className={`
          fixed top-0 right-0 h-full w-[500px] bg-white shadow-2xl z-50
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : 'translate-x-full'}
        `}
      >
        {/* Header */}
        <div className="p-6 border-b">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1 min-w-0 mr-4">
              {/* Editable Title */}
              {isEditingName ? (
                <div className="flex items-center gap-2 mb-2">
                  <input
                    type="text"
                    value={editedName}
                    onChange={(e) => setEditedName(e.target.value)}
                    onBlur={handleSaveName}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveName();
                      if (e.key === 'Escape') {
                        setEditedName(view.name);
                        setIsEditingName(false);
                      }
                    }}
                    autoFocus
                    className="text-xl font-bold text-slate-900 border-b-2 border-blue-500 focus:outline-none bg-transparent w-full"
                  />
                  <Check
                    className="h-5 w-5 text-green-600 cursor-pointer flex-shrink-0"
                    onClick={handleSaveName}
                  />
                </div>
              ) : (
                <h2
                  onClick={() => setIsEditingName(true)}
                  className="text-xl font-bold text-slate-900 cursor-pointer hover:text-blue-600 transition-colors mb-2"
                >
                  {view.name}
                </h2>
              )}

              {/* Editable Description */}
              {isEditingDescription ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={editedDescription}
                    onChange={(e) => setEditedDescription(e.target.value)}
                    onBlur={handleSaveDescription}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveDescription();
                      if (e.key === 'Escape') {
                        setEditedDescription(view.description || '');
                        setIsEditingDescription(false);
                      }
                    }}
                    autoFocus
                    placeholder="Add description..."
                    className="text-sm text-slate-600 border-b border-slate-300 focus:border-blue-500 focus:outline-none bg-transparent w-full"
                  />
                  <Check
                    className="h-4 w-4 text-green-600 cursor-pointer flex-shrink-0"
                    onClick={handleSaveDescription}
                  />
                </div>
              ) : (
                <p
                  onClick={() => setIsEditingDescription(true)}
                  className="text-sm text-slate-600 cursor-pointer hover:text-blue-600 transition-colors"
                >
                  {view.description || 'Click to add description...'}
                </p>
              )}
            </div>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <X className="h-5 w-5 text-slate-500" />
            </button>
          </div>

          {/* Meta Info */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                {filterCount} {filterCount === 1 ? 'filter' : 'filters'}
              </Badge>
              <button
                onClick={onEditFilters}
                className="text-xs text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-1"
              >
                <Filter className="h-3 w-3" />
                Edit Filters
              </button>
            </div>
            {isSaving && (
              <span className="text-xs text-blue-600 flex items-center gap-1">
                <Loader2 className="h-3 w-3 animate-spin" />
                Saving...
              </span>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* View Details */}
          <div>
            <h3 className="text-sm font-semibold text-slate-900 mb-3">View Information</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-600">Created:</span>
                <span className="text-slate-900">
                  {new Date(view.created_at).toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Last Updated:</span>
                <span className="text-slate-900">
                  {new Date(view.updated_at).toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Category:</span>
                <Badge variant="secondary" className="text-xs">
                  {view.category || 'Uncategorized'}
                </Badge>
              </div>
            </div>
          </div>

          {/* Filter Preview */}
          {filterCount > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-slate-900 mb-3">Active Filters</h3>
              <div className="bg-slate-50 rounded-lg p-4">
                <p className="text-xs text-slate-600 mb-2">
                  This view has {filterCount} filter{filterCount > 1 ? 's' : ''} configured.
                  Click &quot;Edit Filters&quot; to modify them.
                </p>
              </div>
            </div>
          )}

          {/* Actions */}
          <div>
            <h3 className="text-sm font-semibold text-slate-900 mb-3">Actions</h3>
            <div className="space-y-2">
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
                onClick={onEditFilters}
              >
                <Filter className="h-4 w-4 mr-2" />
                Edit Filters
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                onClick={handleDelete}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete View
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
