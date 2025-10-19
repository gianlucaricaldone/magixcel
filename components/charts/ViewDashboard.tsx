'use client';

import { useState, useEffect } from 'react';
import { ViewChart } from '@/types/charts';
import { IView } from '@/types/database';
import { ChartDisplay } from './ChartDisplay';
import { ChartBuilder } from './ChartBuilder';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Plus, Grid3x3, Loader2, BarChart3 } from 'lucide-react';

interface ViewDashboardProps {
  view: IView;
  data: any[];
  columns: string[];
}

export function ViewDashboard({ view, data, columns }: ViewDashboardProps) {
  const [charts, setCharts] = useState<ViewChart[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddingChart, setIsAddingChart] = useState(false);
  const [editingChart, setEditingChart] = useState<ViewChart | null>(null);

  // Load charts
  useEffect(() => {
    loadCharts();
  }, [view.id]);

  const loadCharts = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/views/${view.id}/charts`);
      const result = await response.json();

      if (result.success) {
        setCharts(result.charts);
      }
    } catch (error) {
      console.error('Error loading charts:', error);
    } finally {
      setIsLoading(false);
    }
  };

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
          await loadCharts();
          setEditingChart(null);
        }
      } else {
        // Create new chart
        const response = await fetch(`/api/views/${view.id}/charts`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: chartConfig.title,
            chart_type: chartConfig.type,
            config: JSON.stringify(chartConfig),
            size: chartConfig.size || 'medium',
          }),
        });

        const result = await response.json();
        if (result.success) {
          await loadCharts();
          setIsAddingChart(false);
        }
      }
    } catch (error) {
      console.error('Error saving chart:', error);
      alert('Failed to save chart');
    }
  };

  const handleDeleteChart = async (chartId: string) => {
    if (!confirm('Are you sure you want to delete this chart?')) {
      return;
    }

    try {
      const response = await fetch(`/api/views/${view.id}/charts/${chartId}`, {
        method: 'DELETE',
      });

      const result = await response.json();
      if (result.success) {
        await loadCharts();
      }
    } catch (error) {
      console.error('Error deleting chart:', error);
      alert('Failed to delete chart');
    }
  };

  const handleEditChart = (chart: ViewChart) => {
    setEditingChart(chart);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Dashboard Header */}
      <div className="bg-white border-b px-6 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-bold text-slate-900">{view.name}</h2>
            <Badge variant="outline" className="gap-1">
              <BarChart3 className="h-3 w-3" />
              {charts.length} {charts.length === 1 ? 'chart' : 'charts'}
            </Badge>
            <Badge variant="secondary">
              {data.length} rows
            </Badge>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setIsAddingChart(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Chart
            </Button>
          </div>
        </div>

        {view.description && (
          <p className="text-sm text-slate-600 mt-2">{view.description}</p>
        )}
      </div>

      {/* Charts Grid */}
      <div className="flex-1 p-6 overflow-auto bg-slate-50">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-2" />
              <p className="text-sm text-slate-600">Loading charts...</p>
            </div>
          </div>
        ) : charts.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center max-w-md">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                <BarChart3 className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                No charts yet
              </h3>
              <p className="text-sm text-slate-600 mb-4">
                Add your first chart to visualize the data and gain insights
              </p>
              <Button onClick={() => setIsAddingChart(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Chart
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-4 auto-rows-min">
            {charts.map((chart) => (
              <ChartDisplay
                key={chart.id}
                chart={chart}
                data={data}
                onEdit={() => handleEditChart(chart)}
                onDelete={() => handleDeleteChart(chart.id)}
                interactive={true}
              />
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit Chart Modal */}
      <Dialog
        open={isAddingChart || !!editingChart}
        onOpenChange={(open) => {
          if (!open) {
            setIsAddingChart(false);
            setEditingChart(null);
          }
        }}
      >
        <DialogContent className="max-w-7xl h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>
              {editingChart ? 'Edit Chart' : 'Create New Chart'}
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-auto">
            <ChartBuilder
              data={data}
              columns={columns}
              initialConfig={editingChart ? JSON.parse(editingChart.config) : undefined}
              onSave={handleSaveChart}
              onCancel={() => {
                setIsAddingChart(false);
                setEditingChart(null);
              }}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
