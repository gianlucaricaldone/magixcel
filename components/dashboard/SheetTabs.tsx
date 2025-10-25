'use client';

import { useDataStore } from '@/stores/data-store';
import { cn } from '@/lib/utils';
import { FileSpreadsheet } from 'lucide-react';

export function SheetTabs() {
  const { sheets, activeSheet, setActiveSheet } = useDataStore();

  // Don't render if only one sheet or no sheets
  if (sheets.length <= 1) {
    return null;
  }

  return (
    <div className="flex-shrink-0 bg-slate-50 border-t border-slate-200 px-3 py-1.5 flex items-center gap-1 overflow-x-auto">
      {sheets.map((sheet) => {
        const isActive = sheet.sheetName === activeSheet;
        const hasFilters = sheet.filteredRowCount !== undefined && sheet.filteredRowCount !== sheet.rowCount;
        const displayCount = hasFilters ? sheet.filteredRowCount! : sheet.rowCount;

        return (
          <button
            key={sheet.sheetName}
            onClick={() => setActiveSheet(sheet.sheetName)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-medium transition-colors whitespace-nowrap',
              isActive
                ? 'bg-white text-blue-600 border border-slate-200 shadow-sm'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            )}
            title={`${sheet.sheetName} (${hasFilters ? `${displayCount.toLocaleString()} of ${sheet.rowCount.toLocaleString()}` : `${sheet.rowCount.toLocaleString()} rows`})`}
          >
            <FileSpreadsheet className="h-3.5 w-3.5 flex-shrink-0" />
            <span>{sheet.sheetName}</span>
            <span className={cn(
              "text-xs",
              isActive && hasFilters ? "text-blue-500 font-semibold" : "text-slate-400"
            )}>
              ({displayCount.toLocaleString()}{hasFilters && ` / ${sheet.rowCount.toLocaleString()}`})
            </span>
          </button>
        );
      })}
    </div>
  );
}
