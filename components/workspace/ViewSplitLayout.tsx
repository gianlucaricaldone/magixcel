'use client';

import { useState, useEffect } from 'react';
import { IView } from '@/types/database';
import { ViewChart } from '@/types/charts';
import { DataTable } from '@/components/table/DataTable';
import { ChartDisplay } from '@/components/charts/ChartDisplay';
import { ChartBuilder } from '@/components/charts/ChartBuilder';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, BarChart3, Loader2, Sparkles } from 'lucide-react';
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
}

export function ViewSplitLayout({ view, data, columns }: ViewSplitLayoutProps) {
  const [charts, setCharts] = useState<ViewChart[]>([]);
  const [isLoadingCharts, setIsLoadingCharts] = useState(true);
  const [isChartBuilderOpen, setIsChartBuilderOpen] = useState(false);
  const [editingChart, setEditingChart] = useState<ViewChart | null>(null);

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
    <>
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Data Table */}
        <div className="w-1/2 bg-white border-r flex flex-col">
          <div className="p-4 border-b">
            <h3 className="font-semibold text-slate-900">{view.name}</h3>
            <p className="text-sm text-slate-600 mt-1">
              {data.length} rows · {columns.length} columns
            </p>
          </div>
          <div className="flex-1 overflow-hidden">
            <DataTable columns={columns} data={data} />
          </div>
        </div>

        {/* Right: Charts */}
        <div className="w-1/2 bg-slate-50 flex flex-col">
          <div className="p-4 border-b bg-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h3 className="font-semibold text-slate-900">Charts</h3>
              <Badge variant="outline">
                <BarChart3 className="h-3 w-3 mr-1" />
                {charts.length}
              </Badge>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => setIsChartBuilderOpen(true)} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Chart
              </Button>
              <Button variant="outline" size="sm" disabled>
                <Sparkles className="h-4 w-4 mr-2" />
                Magic Charts
              </Button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
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
              <div className="grid grid-cols-1 gap-4">
                {charts.map((chart) => (
                  <div
                    key={chart.id}
                    className={`
                      bg-white rounded-lg border p-6
                      ${chart.size === 'small' ? 'h-64' : 'h-96'}
                    `}
                  >
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
      </div>

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
    </>
  );
}
