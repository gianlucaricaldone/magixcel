'use client';

import { Loader2, Check } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface StatusBarProps {
  filteredCount: number;
  totalCount: number;
  selectedCount?: number;
  isSaving?: boolean;
  lastSavedAt?: Date | null;
}

export function StatusBar({
  filteredCount,
  totalCount,
  selectedCount = 0,
  isSaving = false,
  lastSavedAt = null,
}: StatusBarProps) {
  const isFiltered = filteredCount !== totalCount;

  return (
    <div className="h-10 bg-white border-t border-slate-200 px-6 flex items-center justify-between text-xs text-slate-600">
      {/* Left: Current view */}
      <div className="flex items-center gap-4">
        <span>
          Showing <strong className="text-slate-900">{filteredCount.toLocaleString()}</strong> row{filteredCount !== 1 ? 's' : ''}
          {isFiltered && (
            <>
              {' '}
              <span className="text-slate-500">(filtered from {totalCount.toLocaleString()} total)</span>
            </>
          )}
        </span>

        {selectedCount > 0 && (
          <>
            <span className="text-slate-400">•</span>
            <span className="text-blue-600 font-medium">
              {selectedCount} row{selectedCount !== 1 ? 's' : ''} selected
            </span>
          </>
        )}
      </div>

      {/* Right: Additional info */}
      <div className="flex items-center gap-4 text-slate-500">
        {/* Auto-save indicator */}
        {isSaving ? (
          <span className="flex items-center gap-1.5 text-blue-600">
            <Loader2 className="h-3 w-3 animate-spin" />
            Saving...
          </span>
        ) : lastSavedAt ? (
          <span className="flex items-center gap-1.5 text-green-600">
            <Check className="h-3 w-3" />
            Saved {formatDistanceToNow(lastSavedAt, { addSuffix: true })}
          </span>
        ) : null}

        <span className="text-slate-400">•</span>
        <span className="text-xs text-green-600 font-medium">
          Virtual scrolling enabled
        </span>
      </div>
    </div>
  );
}
