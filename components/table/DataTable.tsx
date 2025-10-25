'use client';

import { useRef, useEffect, useState } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useDataStore } from '@/stores/data-store';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';

interface DataTableProps {
  columns: string[];
  data?: any[]; // Optional: if provided, use this instead of store data
}

/**
 * Format cell value for display
 */
function formatCellValue(value: any): string {
  if (value === null || value === undefined) return '-';

  // Handle Date objects
  if (value instanceof Date) {
    return value.toLocaleDateString('it-IT', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  }

  // Handle objects (check for nested objects with specific keys)
  if (typeof value === 'object') {
    // Try to extract meaningful value from object
    if ('value' in value) return String(value.value);
    if ('display' in value) return String(value.display);
    // If it's a plain object, try JSON stringify
    try {
      return JSON.stringify(value);
    } catch {
      return '[Object]';
    }
  }

  // Handle numbers
  if (typeof value === 'number') {
    // Check if it looks like a price (has decimals or is large)
    if (value % 1 !== 0 || value > 100) {
      return value.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
    return value.toLocaleString('it-IT');
  }

  // Default: convert to string
  return String(value);
}

export function DataTable({ columns, data: propData }: DataTableProps) {
  const {
    filteredData: storeData,
    sortColumn,
    sortDirection,
    setSorting,
  } = useDataStore();

  // Use prop data if provided, otherwise use store data
  const filteredData = propData !== undefined ? propData : storeData;

  const parentRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const [isMounted, setIsMounted] = useState(false);

  // Set mounted flag after first render
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Sync horizontal scroll between header and body
  useEffect(() => {
    const bodyEl = parentRef.current;
    const headerEl = headerRef.current;

    if (!bodyEl || !headerEl) return;

    const handleScroll = () => {
      headerEl.scrollLeft = bodyEl.scrollLeft;
    };

    bodyEl.addEventListener('scroll', handleScroll);
    return () => bodyEl.removeEventListener('scroll', handleScroll);
  }, []);

  // Virtual scrolling setup - only after component is mounted
  const rowVirtualizer = useVirtualizer({
    count: isMounted ? filteredData.length : 0,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 38, // Estimated row height in pixels
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
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Sticky Header */}
      <div
        ref={headerRef}
        className="flex-shrink-0 bg-slate-50 border-b border-slate-200 overflow-x-auto overflow-y-hidden scrollbar-hide"
      >
        <div className="flex">
          {columns.map((col) => (
            <div
              key={col}
              className="flex-1 min-w-[120px] px-3 py-2 text-left text-sm font-semibold text-slate-700 cursor-pointer hover:bg-slate-100 transition-colors select-none border-r border-slate-200 last:border-r-0"
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
          minHeight: 0, // Allow flex item to shrink below content size
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
                {columns.map((col) => {
                  const formattedValue = formatCellValue(row[col]);
                  return (
                    <div
                      key={col}
                      className="flex-1 min-w-[120px] px-3 py-2 text-sm text-slate-600 truncate border-r border-slate-100 last:border-r-0"
                      title={formattedValue}
                    >
                      {formattedValue}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
