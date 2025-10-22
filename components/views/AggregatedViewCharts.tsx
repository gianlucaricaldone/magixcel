'use client';

import { useState, useEffect } from 'react';
import { ViewChart } from '@/types/charts';
import { IView } from '@/types/database';
import { ChartDisplay } from '@/components/charts/ChartDisplay';
import { Loader2, BarChart3 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface AggregatedViewChartsProps {
  activeViews: IView[];
  data: any[];
  columns: string[];
}

interface ViewWithCharts {
  view: IView;
  charts: ViewChart[];
}

export function AggregatedViewCharts({
  activeViews,
  data,
  columns,
}: AggregatedViewChartsProps) {
  const [viewCharts, setViewCharts] = useState<ViewWithCharts[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load charts for all active views
  useEffect(() => {
    const loadAllCharts = async () => {
      setIsLoading(true);

      try {
        const results = await Promise.all(
          activeViews.map(async (view) => {
            try {
              const response = await fetch(`/api/views/${view.id}/charts`);
              const result = await response.json();

              return {
                view,
                charts: result.success ? result.charts : [],
              };
            } catch (error) {
              console.error(`Error loading charts for view ${view.id}:`, error);
              return {
                view,
                charts: [],
              };
            }
          })
        );

        setViewCharts(results);
      } catch (error) {
        console.error('Error loading aggregated charts:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (activeViews.length > 0) {
      loadAllCharts();
    } else {
      setViewCharts([]);
      setIsLoading(false);
    }
  }, [activeViews]);

  // Calculate total charts count
  const totalCharts = viewCharts.reduce((sum, vc) => sum + vc.charts.length, 0);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-3" />
          <p className="text-sm text-slate-600">Loading charts...</p>
        </div>
      </div>
    );
  }

  if (totalCharts === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center max-w-md">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-100 rounded-full mb-4">
            <BarChart3 className="h-8 w-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">
            No Charts Available
          </h3>
          <p className="text-sm text-slate-600">
            {activeViews.length > 0
              ? 'The selected views don\'t have any charts yet. Click on a view name to add charts.'
              : 'Check views from the sidebar to see their charts'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Summary Header */}
      <div className="bg-white rounded-lg border p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-slate-900">
              Aggregated Charts from {activeViews.length} View{activeViews.length > 1 ? 's' : ''}
            </h3>
            <p className="text-sm text-slate-600 mt-1">
              {totalCharts} chart{totalCharts > 1 ? 's' : ''} total
            </p>
          </div>
          <Badge variant="secondary">
            {activeViews.map((v) => v.name).join(' + ')}
          </Badge>
        </div>
      </div>

      {/* Charts grouped by view */}
      {viewCharts.map(({ view, charts }) => {
        if (charts.length === 0) return null;

        return (
          <div key={view.id} className="space-y-4">
            {/* View Header */}
            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-slate-200" />
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-semibold text-slate-700">
                  {view.name}
                </h4>
                <Badge variant="outline" className="text-xs">
                  {charts.length} {charts.length === 1 ? 'chart' : 'charts'}
                </Badge>
              </div>
              <div className="h-px flex-1 bg-slate-200" />
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {charts.map((chart) => (
                <div
                  key={chart.id}
                  className={`
                    bg-white rounded-lg border p-6
                    ${chart.size === 'large' ? 'lg:col-span-2' : ''}
                    ${chart.size === 'small' ? 'h-64' : 'h-96'}
                  `}
                >
                  <ChartDisplay
                    chart={chart}
                    data={data}
                    columns={columns}
                    onEdit={() => {
                      // Edit functionality can be added here if needed
                      console.log('Edit chart:', chart.id);
                    }}
                    onDelete={() => {
                      // Delete functionality can be added here if needed
                      console.log('Delete chart:', chart.id);
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
