'use client';

interface StatusBarProps {
  filteredCount: number;
  totalCount: number;
  selectedCount?: number;
}

export function StatusBar({
  filteredCount,
  totalCount,
  selectedCount = 0,
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
        <span className="text-xs text-green-600 font-medium">
          Virtual scrolling enabled
        </span>
      </div>
    </div>
  );
}
