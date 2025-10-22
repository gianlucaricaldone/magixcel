'use client';

import { useState, useRef, useEffect } from 'react';
import { Bar, Line, Pie, Doughnut, Scatter, Radar } from 'react-chartjs-2';
import { Chart as ChartJS } from 'chart.js';
import { ViewChart, ChartConfiguration } from '@/types/charts';
import { processChartData, generateChartOptions } from '@/lib/charts/data-processor';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Maximize2, Edit2, Trash2, Download } from 'lucide-react';

// Dynamically import chart setup only on client side
if (typeof window !== 'undefined') {
  import('@/lib/charts/setup');
}

interface ChartDisplayProps {
  chart: ViewChart;
  data: any[];
  onEdit?: () => void;
  onDelete?: () => void;
  interactive?: boolean;
}

export function ChartDisplay({
  chart,
  data,
  onEdit,
  onDelete,
  interactive = true,
}: ChartDisplayProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [drillDownData, setDrillDownData] = useState<{
    label: string;
    value: number;
    items: any[];
  } | null>(null);
  const chartRef = useRef<ChartJS>(null);

  // Parse config
  const config: ChartConfiguration = JSON.parse(chart.config);

  // Process data for chart
  const chartData = processChartData(data, config);
  const chartOptions = generateChartOptions(config);

  // Add click handler for drill-down
  if (interactive) {
    chartOptions.onClick = (event: any, elements: any[]) => {
      if (elements.length > 0) {
        const element = elements[0];
        const datasetIndex = element.datasetIndex;
        const index = element.index;

        const label = chartData.labels?.[index] || '';
        const value = chartData.datasets[datasetIndex]?.data[index] || 0;

        // Filter data for this point
        const items = data.filter((row) => {
          if (config.xAxis) {
            return String(row[config.xAxis]) === String(label);
          }
          return true;
        });

        setDrillDownData({
          label: String(label),
          value: typeof value === 'number' ? value : 0,
          items,
        });
      }
    };
  }

  // Export chart as image
  const handleExport = () => {
    const chartInstance = chartRef.current;
    if (!chartInstance) return;

    const url = chartInstance.toBase64Image();
    const link = document.createElement('a');
    link.download = `${config.title || chart.title || 'chart'}-${Date.now()}.png`;
    link.href = url;
    link.click();
  };

  // Render appropriate chart type
  const renderChart = (fullscreen = false) => {
    const chartProps: any = {
      ref: chartRef,
      data: chartData,
      options: {
        ...chartOptions,
        maintainAspectRatio: !fullscreen,
        aspectRatio: fullscreen ? undefined : 2,
      },
    };

    switch (config.type) {
      case 'bar':
        return <Bar {...chartProps} />;
      case 'line':
      case 'area':
        return <Line {...chartProps} />;
      case 'pie':
        return <Pie {...chartProps} />;
      case 'doughnut':
        return <Doughnut {...chartProps} />;
      case 'scatter':
      case 'bubble':
        return <Scatter {...chartProps} />;
      case 'radar':
        return <Radar {...chartProps} />;
      default:
        return (
          <div className="flex items-center justify-center h-full text-slate-500">
            Unsupported chart type: {config.type}
          </div>
        );
    }
  };

  // Get size classes
  const getSizeClasses = () => {
    switch (chart.size) {
      case 'small':
        return 'col-span-1';
      case 'medium':
        return 'col-span-2';
      case 'large':
        return 'col-span-3';
      case 'full':
        return 'col-span-4';
      default:
        return 'col-span-2';
    }
  };

  return (
    <>
      <div className={`bg-white rounded-lg border shadow-sm ${getSizeClasses()}`}>
        {/* Chart Header */}
        <div className="flex justify-between items-center px-4 py-3 border-b bg-slate-50">
          <h3 className="font-semibold text-slate-900">{chart.title}</h3>
          {interactive && (
            <div className="flex gap-1">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setIsFullscreen(true)}
                className="h-8 w-8 p-0"
                title="Fullscreen"
              >
                <Maximize2 className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleExport}
                className="h-8 w-8 p-0"
                title="Export as PNG"
              >
                <Download className="h-4 w-4" />
              </Button>
              {onEdit && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={onEdit}
                  className="h-8 w-8 p-0"
                  title="Edit"
                >
                  <Edit2 className="h-4 w-4" />
                </Button>
              )}
              {onDelete && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={onDelete}
                  className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                  title="Delete"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Chart Body */}
        <div className="p-4">
          {data.length === 0 ? (
            <div className="flex items-center justify-center h-64 text-slate-500">
              No data available
            </div>
          ) : (
            <div className="relative" style={{ height: chart.size === 'small' ? '200px' : '400px' }}>
              {renderChart(false)}
            </div>
          )}
        </div>
      </div>

      {/* Fullscreen Modal */}
      {isFullscreen && (
        <Dialog open={isFullscreen} onOpenChange={setIsFullscreen}>
          <DialogContent className="max-w-[90vw] h-[90vh] flex flex-col">
            <DialogHeader>
              <DialogTitle>{chart.title}</DialogTitle>
            </DialogHeader>
            <div className="flex-1 p-4">
              {renderChart(true)}
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Drill-down Modal */}
      {drillDownData && (
        <Dialog open={!!drillDownData} onOpenChange={() => setDrillDownData(null)}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-auto">
            <DialogHeader>
              <DialogTitle>
                Drill-down: {drillDownData.label}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 bg-blue-50 rounded-lg">
                <div>
                  <div className="text-sm text-blue-600 font-medium">Value</div>
                  <div className="text-2xl font-bold text-blue-900">
                    {new Intl.NumberFormat('en-US').format(drillDownData.value)}
                  </div>
                </div>
                <div className="border-l pl-4">
                  <div className="text-sm text-blue-600 font-medium">Records</div>
                  <div className="text-2xl font-bold text-blue-900">
                    {drillDownData.items.length}
                  </div>
                </div>
              </div>

              {drillDownData.items.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-slate-100 border-b">
                        {Object.keys(drillDownData.items[0]).map((key) => (
                          <th
                            key={key}
                            className="px-4 py-2 text-left text-xs font-semibold text-slate-700 uppercase"
                          >
                            {key}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {drillDownData.items.slice(0, 100).map((row, idx) => (
                        <tr key={idx} className="border-b hover:bg-slate-50">
                          {Object.values(row).map((val, cellIdx) => (
                            <td key={cellIdx} className="px-4 py-2 text-sm text-slate-900">
                              {val !== null && val !== undefined ? String(val) : '-'}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {drillDownData.items.length > 100 && (
                    <p className="text-sm text-slate-500 text-center py-2">
                      Showing first 100 of {drillDownData.items.length} records
                    </p>
                  )}
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
