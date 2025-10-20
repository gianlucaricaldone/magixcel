'use client';

import { useState } from 'react';
import { DataTable } from '@/components/table/DataTable';
import { FilterPanel } from '@/components/dashboard/FilterPanel';
import { TableStatsBar } from '@/components/dashboard/TableStatsBar';
import { Button } from '@/components/ui/button';
import { Save, BarChart3 } from 'lucide-react';

interface ExplorerTabProps {
  data: any[];
  filteredData: any[];
  columns: string[];
  columnCount: number;
  onOpenFilterBuilder: () => void;
  onSaveAsView: () => void;
}

export function ExplorerTab({
  data,
  filteredData,
  columns,
  columnCount,
  onOpenFilterBuilder,
  onSaveAsView,
}: ExplorerTabProps) {
  const hasFilters = filteredData.length !== data.length;

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* Sidebar - Filters */}
      <div className="w-80 border-r bg-slate-50 flex flex-col">
        <div className="p-4 border-b bg-white">
          <h3 className="font-semibold text-slate-900 flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Live Filters
          </h3>
          <p className="text-xs text-slate-600 mt-1">
            Apply filters to explore your data. Changes are temporary.
          </p>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <FilterPanel onOpenFilterBuilder={onOpenFilterBuilder} />
        </div>

        {/* Action Bar - Save as View */}
        {hasFilters && (
          <div className="p-4 border-t bg-white">
            <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-xs text-blue-800">
                <strong>💡 Tip:</strong> Save these filters as a View to keep them permanently and add charts.
              </p>
            </div>
            <Button
              onClick={onSaveAsView}
              className="w-full"
              size="sm"
            >
              <Save className="h-4 w-4 mr-2" />
              Save as View
            </Button>
          </div>
        )}
      </div>

      {/* Main Content - Data Table */}
      <div className="flex-1 flex flex-col min-h-0">
        <div className="flex-1 min-h-0 overflow-hidden">
          <div className="h-full bg-white overflow-hidden flex flex-col">
            {/* Stats Bar */}
            <TableStatsBar
              totalRows={data.length}
              totalColumns={columnCount}
              filteredRows={filteredData.length}
            />
            {/* Table */}
            <div className="flex-1 overflow-hidden">
              <DataTable columns={columns} />
            </div>
          </div>
        </div>

        {/* Info Banner */}
        {!hasFilters && (
          <div className="border-t bg-slate-50 px-6 py-3">
            <p className="text-sm text-slate-600">
              <strong>Explorer Mode:</strong> Add filters to explore your data. All changes are temporary and will reset when you switch tabs.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
