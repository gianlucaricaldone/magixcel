'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { IView, IFilterConfig } from '@/types/database';
import { ViewChart } from '@/types/charts';
import { DataTable } from '@/components/table/DataTable';
import { ChartDisplay } from '@/components/charts/ChartDisplay';
import { ChartBuilder } from '@/components/charts/ChartBuilder';
import { ViewFilterEditor } from '@/components/views/ViewFilterEditor';
import { applyFilters } from '@/lib/processing/filter-engine';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, BarChart3, Loader2, ChevronRight, ChevronLeft, Filter } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

interface ViewSplitLayoutProps {
  view: IView;
  data: any[];
  columns: string[];
  onViewUpdated?: () => void; // Called when view filters are saved
}

export function ViewSplitLayout({ view, data, columns, onViewUpdated }: ViewSplitLayoutProps) {
  const [charts, setCharts] = useState<ViewChart[]>([]);
  const [isLoadingCharts, setIsLoadingCharts] = useState(true);
  const [isChartBuilderOpen, setIsChartBuilderOpen] = useState(false);
  const [editingChart, setEditingChart] = useState<ViewChart | null>(null);

  // Live filter config (changes as user edits, not saved until click "Save")
  const [liveFilterConfig, setLiveFilterConfig] = useState<IFilterConfig>(
    view.filter_config || { filters: [], combinator: 'AND' }
  );

  // Filters panel state (left side)
  const [isFiltersPanelOpen, setIsFiltersPanelOpen] = useState(false);
  const [filtersPanelWidth, setFiltersPanelWidth] = useState(350); // Default width in pixels
  const [isResizingFilters, setIsResizingFilters] = useState(false);
  const resizeFiltersRef = useRef<HTMLDivElement>(null);

  // Charts panel state (right side)
  const [isChartsPanelOpen, setIsChartsPanelOpen] = useState(false);
  const [chartsPanelWidth, setChartsPanelWidth] = useState(400); // Default width in pixels
  const [isResizingCharts, setIsResizingCharts] = useState(false);
  const resizeChartsRef = useRef<HTMLDivElement>(null);

  // Reset live filter config when view changes
  useEffect(() => {
    setLiveFilterConfig(view.filter_config || { filters: [], combinator: 'AND' });
  }, [view.id, view.filter_config]);

  // Load charts for this view
  useEffect(() => {
    const loadCharts = async () => {
      setIsLoadingCharts(true);
      try {
        const response = await fetch(`/api/views/${view.id}/charts`);
        const result = await response.json();

        if (result.success) {
          setCharts(result.charts);
        }
      } catch (error) {
        console.error('Error loading charts:', error);
      } finally {
        setIsLoadingCharts(false);
      }
    };

    loadCharts();
  }, [view.id]);

  // Apply live filters to data
  const filteredData = useMemo(() => {
    if (!liveFilterConfig || !liveFilterConfig.filters || liveFilterConfig.filters.length === 0) {
      return data;
    }

    try {
      return applyFilters(data, liveFilterConfig, '');
    } catch (error) {
      console.error('Error applying filters:', error);
      return data;
    }
  }, [data, liveFilterConfig]);

  // Handle resize for Charts panel (right)
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizingCharts) return;

      const newWidth = window.innerWidth - e.clientX;
      // Min width 300px, max width 80% of window
      const minWidth = 300;
      const maxWidth = window.innerWidth * 0.8;

      if (newWidth >= minWidth && newWidth <= maxWidth) {
        setChartsPanelWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizingCharts(false);
    };

    if (isResizingCharts) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizingCharts]);

  // Handle resize for Filters panel (left)
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizingFilters) return;

      const newWidth = e.clientX;
      // Min width 250px, max width 50% of window
      const minWidth = 250;
      const maxWidth = window.innerWidth * 0.5;

      if (newWidth >= minWidth && newWidth <= maxWidth) {
        setFiltersPanelWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizingFilters(false);
    };

    if (isResizingFilters) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizingFilters]);

  const handleSaveChart = async (chartConfig: any) => {
    try {
      if (editingChart) {
        // Update existing chart
        const response = await fetch(`/api/views/${view.id}/charts/${editingChart.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: chartConfig.title,
            config: JSON.stringify(chartConfig),
            size: chartConfig.size || 'medium',
          }),
        });

        const result = await response.json();
        if (result.success) {
          // Reload charts
          const res = await fetch(`/api/views/${view.id}/charts`);
          const data = await res.json();
          if (data.success) setCharts(data.charts);
          setEditingChart(null);
          setIsChartBuilderOpen(false);
        }
      } else {
        // Create new chart
        const response = await fetch(`/api/views/${view.id}/charts`, {
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
          // Reload charts
          const res = await fetch(`/api/views/${view.id}/charts`);
          const data = await res.json();
          if (data.success) setCharts(data.charts);
          setIsChartBuilderOpen(false);
        }
      }
    } catch (error) {
      console.error('Error saving chart:', error);
      alert('Failed to save chart');
    }
  };

  const handleDeleteChart = async (chartId: string) => {
    if (!confirm('Are you sure you want to delete this chart?')) return;

    try {
      const response = await fetch(`/api/views/${view.id}/charts/${chartId}`, {
        method: 'DELETE',
      });

      const result = await response.json();
      if (result.success) {
        setCharts(charts.filter((c) => c.id !== chartId));
      }
    } catch (error) {
      console.error('Error deleting chart:', error);
      alert('Failed to delete chart');
    }
  };

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* Filters Panel - Collapsible and Resizable (LEFT) */}
      {isFiltersPanelOpen && (
        <>
          {/* Filters Panel */}
          <div
            className="flex-shrink-0 bg-slate-50 flex flex-col overflow-hidden min-h-0"
            style={{ width: `${filtersPanelWidth}px` }}
          >
            <div className="h-14 px-4 border-b bg-white flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-3">
                <h3 className="font-semibold text-slate-900">Filters</h3>
                <Badge variant="outline">
                  <Filter className="h-3 w-3 mr-1" />
                  {liveFilterConfig.filters.length}
                </Badge>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsFiltersPanelOpen(false)}
                className="h-8 w-8"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
            </div>

            {/* Filter Editor - Takes remaining space with its own scroll */}
            <div className="flex-1 min-h-0">
              <ViewFilterEditor
                viewId={view.id}
                initialFilterConfig={view.filter_config || { filters: [], combinator: 'AND' }}
                columns={columns}
                onFiltersChange={(config) => {
                  // Update live filter config (data updates immediately)
                  setLiveFilterConfig(config);
                }}
                onSaved={() => {
                  // Notify parent to reload view data
                  if (onViewUpdated) {
                    onViewUpdated();
                  } else {
                    // Fallback: reload page if no callback provided
                    window.location.reload();
                  }
                }}
              />
            </div>
          </div>

          {/* Resize Handle */}
          <div
            ref={resizeFiltersRef}
            onMouseDown={() => setIsResizingFilters(true)}
            className="w-1 bg-slate-200 hover:bg-blue-500 cursor-col-resize transition-colors flex-shrink-0 relative group"
          >
            <div className="absolute inset-y-0 -left-1 -right-1" />
          </div>
        </>
      )}

      {/* Vertical Sidebar for Filters Toggle - Only when panel is closed */}
      {!isFiltersPanelOpen && (
        <div className="w-12 bg-slate-100 border-r border-slate-200 flex flex-col items-center py-4 flex-shrink-0">
          <button
            onClick={() => setIsFiltersPanelOpen(true)}
            className="p-2 rounded-lg hover:bg-slate-200 transition-colors group relative"
            title="Open Filters Panel"
          >
            <Filter className="h-5 w-5 text-slate-600" />
            {liveFilterConfig.filters.length > 0 && (
              <span className="absolute -top-1 -right-1 h-5 w-5 bg-blue-600 text-white text-xs rounded-full flex items-center justify-center font-medium">
                {liveFilterConfig.filters.length}
              </span>
            )}
          </button>
        </div>
      )}

      {/* Data Table Section - Takes remaining space */}
      <div className="flex-1 flex flex-col overflow-hidden min-h-0">
        {/* Header with View Name */}
        <div className="h-14 px-4 border-b bg-white flex items-center flex-shrink-0">
          <h3 className="font-semibold text-slate-900">{view.name}</h3>
        </div>

        {/* Toolbar */}
        <div className="h-10 px-4 border-b bg-slate-50 flex items-center justify-between flex-shrink-0">
          <div className="text-xs text-slate-500">
            {filteredData.length} rows {filteredData.length !== data.length && (
              <span className="text-blue-600">({data.length} total)</span>
            )} · {columns.length} columns
          </div>
        </div>

        {/* Table - Takes remaining vertical space and handles its own scroll */}
        <DataTable columns={columns} data={filteredData} />
      </div>

      {/* Vertical Sidebar for Charts Toggle - Only when panel is closed */}
      {!isChartsPanelOpen && (
        <div className="w-12 bg-slate-100 border-l border-slate-200 flex flex-col items-center py-4 flex-shrink-0">
          <button
            onClick={() => setIsChartsPanelOpen(true)}
            className="p-2 rounded-lg hover:bg-slate-200 transition-colors group relative"
            title="Open Charts Panel"
          >
            <BarChart3 className="h-5 w-5 text-slate-600" />
            {charts.length > 0 && (
              <span className="absolute -top-1 -right-1 h-5 w-5 bg-blue-600 text-white text-xs rounded-full flex items-center justify-center font-medium">
                {charts.length}
              </span>
            )}
          </button>
        </div>
      )}

      {/* Charts Panel - Collapsible and Resizable */}
      {isChartsPanelOpen && (
        <>
          {/* Resize Handle */}
          <div
            ref={resizeChartsRef}
            onMouseDown={() => setIsResizingCharts(true)}
            className="w-1 bg-slate-200 hover:bg-blue-500 cursor-col-resize transition-colors flex-shrink-0 relative group"
          >
            <div className="absolute inset-y-0 -left-1 -right-1" />
          </div>

          {/* Charts Panel - Fixed width, independent scroll */}
          <div
            className="flex-shrink-0 bg-slate-50 flex flex-col overflow-hidden min-h-0"
            style={{ width: `${chartsPanelWidth}px` }}
          >
              <div className="h-14 px-4 border-b bg-white flex items-center justify-between flex-shrink-0">
                <div className="flex items-center gap-3">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsChartsPanelOpen(false)}
                    className="h-8 w-8"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <h3 className="font-semibold text-slate-900">Charts</h3>
                  <Badge variant="outline">
                    <BarChart3 className="h-3 w-3 mr-1" />
                    {charts.length}
                  </Badge>
                </div>
                <Button onClick={() => setIsChartBuilderOpen(true)} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Chart
                </Button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 min-h-0">
                {isLoadingCharts ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-2" />
                      <p className="text-sm text-slate-600">Loading charts...</p>
                    </div>
                  </div>
                ) : charts.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center max-w-md">
                      <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-100 rounded-full mb-4">
                        <BarChart3 className="h-8 w-8 text-slate-400" />
                      </div>
                      <h3 className="text-lg font-semibold text-slate-900 mb-2">No charts yet</h3>
                      <p className="text-sm text-slate-600 mb-4">
                        Add your first chart to visualize this view&apos;s data
                      </p>
                      <Button onClick={() => setIsChartBuilderOpen(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Create Chart
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div
                    className="grid gap-4 justify-items-center"
                    style={{
                      gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 400px))'
                    }}
                  >
                    {charts.map((chart) => (
                      <div key={chart.id} className="w-full max-w-[400px]">
                        <ChartDisplay
                          chart={chart}
                          data={data}
                          onEdit={() => {
                            setEditingChart(chart);
                            setIsChartBuilderOpen(true);
                          }}
                          onDelete={() => handleDeleteChart(chart.id)}
                          interactive={true}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        )}

      {/* ChartBuilder Dialog */}
      <Dialog open={isChartBuilderOpen} onOpenChange={setIsChartBuilderOpen}>
        <DialogContent className="max-w-7xl h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>
              {editingChart ? 'Edit Chart' : `Create Chart for "${view.name}"`}
            </DialogTitle>
            <DialogDescription>
              Configure your chart settings and preview the result
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-auto">
            <ChartBuilder
              data={data}
              columns={columns}
              initialConfig={editingChart ? JSON.parse(editingChart.config) : undefined}
              onSave={handleSaveChart}
              onCancel={() => {
                setIsChartBuilderOpen(false);
                setEditingChart(null);
              }}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
