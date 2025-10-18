'use client';

import { useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useDataStore } from '@/stores/data-store';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';

interface DataTableProps {
  columns: string[];
}

export function DataTable({ columns }: DataTableProps) {
  const {
    filteredData,
    sortColumn,
    sortDirection,
    setSorting,
  } = useDataStore();

  const parentRef = useRef<HTMLDivElement>(null);

  // Virtual scrolling setup
  const rowVirtualizer = useVirtualizer({
    count: filteredData.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 45, // Estimated row height in pixels
    overscan: 10, // Render 10 extra rows above/below viewport for smooth scrolling
  });

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      // Cycle: asc -> desc -> null
      if (sortDirection === 'asc') {
        setSorting(column, 'desc');
      } else if (sortDirection === 'desc') {
        setSorting(null, null);
      } else {
        setSorting(column, 'asc');
      }
    } else {
      setSorting(column, 'asc');
    }
  };

  const getSortIcon = (column: string) => {
    if (sortColumn !== column) {
      return <ArrowUpDown className="h-4 w-4 opacity-30" />;
    }
    if (sortDirection === 'asc') {
      return <ArrowUp className="h-4 w-4 text-blue-600" />;
    }
    if (sortDirection === 'desc') {
      return <ArrowDown className="h-4 w-4 text-blue-600" />;
    }
    return <ArrowUpDown className="h-4 w-4 opacity-30" />;
  };

  if (filteredData.length === 0) {
    return (
      <div className="text-center py-12 text-slate-500">
        No data to display
      </div>
    );
  }

  const virtualItems = rowVirtualizer.getVirtualItems();

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Sticky Header */}
      <div className="flex-shrink-0 bg-slate-50 border-b border-slate-200">
        <div className="flex">
          {columns.map((col) => (
            <div
              key={col}
              className="flex-1 min-w-[150px] px-4 py-3 text-left text-sm font-semibold text-slate-700 cursor-pointer hover:bg-slate-100 transition-colors select-none border-r border-slate-200 last:border-r-0"
              onClick={() => handleSort(col)}
            >
              <div className="flex items-center gap-2">
                <span className="truncate">{col}</span>
                {getSortIcon(col)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Virtualized Body */}
      <div
        ref={parentRef}
        className="flex-1 overflow-auto"
        style={{
          contain: 'strict',
        }}
      >
        <div
          style={{
            height: `${rowVirtualizer.getTotalSize()}px`,
            width: '100%',
            position: 'relative',
          }}
        >
          {virtualItems.map((virtualRow) => {
            const row = filteredData[virtualRow.index];
            const isEven = virtualRow.index % 2 === 0;

            return (
              <div
                key={virtualRow.index}
                className={`absolute top-0 left-0 w-full flex border-b border-slate-100 hover:bg-blue-50 transition-colors ${
                  isEven ? 'bg-white' : 'bg-slate-50/50'
                }`}
                style={{
                  height: `${virtualRow.size}px`,
                  transform: `translateY(${virtualRow.start}px)`,
                }}
              >
                {columns.map((col) => (
                  <div
                    key={col}
                    className="flex-1 min-w-[150px] px-4 py-3 text-sm text-slate-600 truncate border-r border-slate-100 last:border-r-0"
                    title={row[col] !== null && row[col] !== undefined ? String(row[col]) : '-'}
                  >
                    {row[col] !== null && row[col] !== undefined
                      ? String(row[col])
                      : '-'}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
