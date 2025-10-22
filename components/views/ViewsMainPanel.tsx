'use client';

import { useState } from 'react';
import { IView } from '@/types/database';
import { DataTable } from '@/components/table/DataTable';
import { TableStatsBar } from '@/components/dashboard/TableStatsBar';
import { AggregatedViewCharts } from '@/components/views/AggregatedViewCharts';
import { Database, BarChart3, Layers } from 'lucide-react';

interface ViewsMainPanelProps {
  data: any[];
  columns: string[];
  columnCount: number;
  activeViewIds: string[];
  views: IView[];
}

type SubTab = 'data' | 'charts';

export function ViewsMainPanel({
  data,
  columns,
  columnCount,
  activeViewIds,
  views,
}: ViewsMainPanelProps) {
  const [activeSubTab, setActiveSubTab] = useState<SubTab>('data');

  const activeViewsCount = activeViewIds.length;
  const totalRowCount = data.length;

  return (
    <div className="flex-1 flex flex-col bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Layers className="h-5 w-5" />
                {activeViewsCount > 0 ? (
                  <>
                    {activeViewsCount} View{activeViewsCount > 1 ? 's' : ''} Active
                  </>
                ) : (
                  'All Data'
                )}
              </h2>
              <p className="text-sm text-slate-600 mt-1">
                {activeViewsCount > 0 ? (
                  <>Filters applied in AND logic · {totalRowCount} rows</>
                ) : (
                  <>No filters applied · {totalRowCount} rows</>
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Sub Tabs */}
        <div className="px-6 border-t">
          <div className="flex gap-1">
            <button
              onClick={() => setActiveSubTab('data')}
              className={`
                px-4 py-2.5 text-sm font-medium transition-all relative
                ${
                  activeSubTab === 'data'
                    ? 'text-blue-600'
                    : 'text-slate-600 hover:text-slate-900'
                }
              `}
            >
              <div className="flex items-center gap-2">
                <Database className="h-4 w-4" />
                Data
              </div>
              {activeSubTab === 'data' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
              )}
            </button>

            <button
              onClick={() => setActiveSubTab('charts')}
              className={`
                px-4 py-2.5 text-sm font-medium transition-all relative
                ${
                  activeSubTab === 'charts'
                    ? 'text-blue-600'
                    : 'text-slate-600 hover:text-slate-900'
                }
              `}
            >
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Charts
                {activeViewsCount > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 text-xs bg-blue-100 text-blue-700 rounded">
                    {activeViewsCount}
                  </span>
                )}
              </div>
              {activeSubTab === 'charts' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {activeSubTab === 'data' ? (
          <div className="h-full bg-white flex flex-col">
            <TableStatsBar
              totalRows={totalRowCount}
              totalColumns={columnCount}
              filteredRows={totalRowCount}
            />
            <div className="flex-1 overflow-hidden">
              <DataTable columns={columns} data={data} />
            </div>
          </div>
        ) : (
          <div className="h-full bg-slate-50 p-6 overflow-y-auto">
            <AggregatedViewCharts
              activeViews={views.filter((v) => activeViewIds.includes(v.id))}
              data={data}
              columns={columns}
            />
          </div>
        )}
      </div>
    </div>
  );
}
