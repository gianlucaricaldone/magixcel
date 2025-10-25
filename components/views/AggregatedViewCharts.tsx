'use client';

import { useState, useEffect } from 'react';
import { ViewChart } from '@/types/charts';
import { IView } from '@/types/database';
import { ChartDisplay } from '@/components/charts/ChartDisplay';
import { ChartBuilder } from '@/components/charts/ChartBuilder';
import { Loader2, BarChart3, Plus, Sparkles, Check } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

interface AggregatedViewChartsProps {
  activeViews: IView[];
  data: any[];
  columns: string[];
  sessionId: string; // Needed to load default view if no views selected
  workspaceId: string; // Needed to create default view if it doesn't exist
}

interface ViewWithCharts {
  view: IView;
  charts: ViewChart[];
}

export function AggregatedViewCharts({
  activeViews,
  data,
  columns,
  sessionId,
  workspaceId,
}: AggregatedViewChartsProps) {
  const [viewCharts, setViewCharts] = useState<ViewWithCharts[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedViewForChart, setSelectedViewForChart] = useState<IView | null>(null);
  const [isViewSelectorOpen, setIsViewSelectorOpen] = useState(false);
  const [isChartBuilderOpen, setIsChartBuilderOpen] = useState(false);
  const [defaultView, setDefaultView] = useState<IView | null>(null);

  // Load default "All Data" view
  useEffect(() => {
    const loadDefaultView = async () => {
      try {
        const response = await fetch(`/api/views?sessionId=${sessionId}`);
        const result = await response.json();

        if (result.success && result.views) {
          const allDataView = result.views.find((v: IView) => v.is_default === true);
          setDefaultView(allDataView || null);
        }
      } catch (error) {
        console.error('Error loading default view:', error);
      }
    };

    loadDefaultView();
  }, [sessionId]);

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

  // Handlers for chart creation
  const handleAddChartClick = () => {
    if (activeViews.length === 0) {
      // No views selected → use default "All Data" view
      if (defaultView) {
        setSelectedViewForChart(defaultView);
        setIsChartBuilderOpen(true);
      } else {
        alert('Default view not found. Please refresh the page.');
      }
    } else if (activeViews.length === 1) {
      // Only 1 view selected → open ChartBuilder directly
      setSelectedViewForChart(activeViews[0]);
      setIsChartBuilderOpen(true);
    } else {
      // Multiple views → show view selector first
      setIsViewSelectorOpen(true);
    }
  };

  const handleViewSelected = (view: IView) => {
    setSelectedViewForChart(view);
    setIsViewSelectorOpen(false);
    setIsChartBuilderOpen(true);
  };

  const handleSaveChart = async (chartConfig: any) => {
    if (!selectedViewForChart) return;

    try {
      const response = await fetch(`/api/views/${selectedViewForChart.id}/charts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: chartConfig.title,
          chartType: chartConfig.type,
          config: JSON.stringify(chartConfig),
          size: chartConfig.size || 'medium',
        }),
      });

      const result = await response.json();

      if (result.success) {
        // Reload charts to show the new one
        const updatedCharts = await Promise.all(
          activeViews.map(async (view) => {
            try {
              const res = await fetch(`/api/views/${view.id}/charts`);
              const data = await res.json();
              return { view, charts: data.success ? data.charts : [] };
            } catch {
              return { view, charts: [] };
            }
          })
        );
        setViewCharts(updatedCharts);
        setIsChartBuilderOpen(false);
        setSelectedViewForChart(null);
      } else {
        alert(`Failed to create chart: ${result.error?.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error creating chart:', error);
      alert('Failed to create chart. Please try again.');
    }
  };

  const handleCancelChart = () => {
    setIsChartBuilderOpen(false);
    setSelectedViewForChart(null);
  };

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
          <p className="text-sm text-slate-600 mb-6">
            {activeViews.length > 0
              ? 'The selected views don&apos;t have any charts yet. Create your first chart to visualize the data.'
              : 'Check views from the sidebar to see their charts'}
          </p>

          {/* Action Buttons - Always visible! */}
          <div className="flex gap-3 justify-center">
            <Button onClick={handleAddChartClick}>
              <Plus className="h-4 w-4 mr-2" />
              Add Chart
            </Button>

            <Button
              variant="outline"
              disabled
              className="relative"
            >
              <Sparkles className="h-4 w-4 mr-2" />
              Magic Charts
              <Badge
                variant="secondary"
                className="ml-2 bg-amber-100 text-amber-800 border-amber-300 text-xs px-1.5 py-0"
              >
                Soon
              </Badge>
            </Button>
          </div>
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
          <div className="flex items-center gap-3">
            <Badge variant="secondary">
              {activeViews.map((v) => v.name).join(' + ')}
            </Badge>
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={handleAddChartClick}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Chart
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Magic Charts
                <Badge
                  variant="secondary"
                  className="ml-2 bg-amber-100 text-amber-800 border-amber-300 text-xs px-1.5 py-0"
                >
                  Soon
                </Badge>
              </Button>
            </div>
          </div>
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

      {/* View Selector Dialog */}
      <Dialog open={isViewSelectorOpen} onOpenChange={setIsViewSelectorOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Select View for New Chart</DialogTitle>
            <DialogDescription>
              Choose which view you want to add this chart to
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-4">
            {activeViews.map((view) => (
              <button
                key={view.id}
                onClick={() => handleViewSelected(view)}
                className="w-full p-4 border rounded-lg hover:bg-slate-50 hover:border-blue-500 transition-all text-left group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium text-slate-900 group-hover:text-blue-600">
                      {view.name}
                    </h4>
                    {view.description && (
                      <p className="text-sm text-slate-600 mt-1">
                        {view.description}
                      </p>
                    )}
                  </div>
                  <Check className="h-5 w-5 text-slate-400 group-hover:text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* ChartBuilder Dialog */}
      <Dialog open={isChartBuilderOpen} onOpenChange={setIsChartBuilderOpen}>
        <DialogContent className="max-w-7xl h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>
              Create Chart for &quot;{selectedViewForChart?.name}&quot;
            </DialogTitle>
            <DialogDescription>
              Configure your chart settings and preview the result
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-auto">
            {selectedViewForChart && (
              <ChartBuilder
                data={data}
                columns={columns}
                onSave={handleSaveChart}
                onCancel={handleCancelChart}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
