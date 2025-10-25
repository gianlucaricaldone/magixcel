'use client';

import { useState, useEffect, useMemo } from 'react';
import { ChartConfiguration, ChartType, COLOR_SCHEMES } from '@/types/charts';
import { analyzeData } from '@/lib/charts/data-analysis';
import { suggestCharts } from '@/lib/charts/suggestions';
import { processChartData, generateChartOptions } from '@/lib/charts/data-processor';
import { Bar, Line, Pie, Doughnut, Scatter, Radar } from 'react-chartjs-2';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import {
  BarChart3,
  LineChart,
  PieChart,
  ScatterChart,
  Activity,
  Circle,
  Lightbulb,
  Save,
  X,
} from 'lucide-react';
import '@/lib/charts/setup';

interface ChartBuilderProps {
  data: any[];
  columns: string[];
  initialConfig?: ChartConfiguration;
  onSave: (config: ChartConfiguration) => void;
  onCancel: () => void;
}

const CHART_TYPES = [
  { id: 'bar' as ChartType, label: 'Bar Chart', icon: BarChart3, description: 'Compare categories' },
  { id: 'line' as ChartType, label: 'Line Chart', icon: LineChart, description: 'Show trends' },
  { id: 'area' as ChartType, label: 'Area Chart', icon: Activity, description: 'Cumulative trends' },
  { id: 'pie' as ChartType, label: 'Pie Chart', icon: PieChart, description: 'Part of whole' },
  { id: 'doughnut' as ChartType, label: 'Doughnut', icon: Circle, description: 'Proportions' },
  { id: 'scatter' as ChartType, label: 'Scatter Plot', icon: ScatterChart, description: 'Correlations' },
  { id: 'radar' as ChartType, label: 'Radar', icon: Activity, description: 'Multi-dimensional' },
];

export function ChartBuilder({
  data,
  columns,
  initialConfig,
  onSave,
  onCancel,
}: ChartBuilderProps) {
  // Analyze data
  const analysis = useMemo(() => analyzeData(data, columns), [data, columns]);
  const suggestions = useMemo(() => suggestCharts(data, columns), [data, columns]);

  // Configuration state
  const [chartType, setChartType] = useState<ChartType>(initialConfig?.type || 'bar');
  const [title, setTitle] = useState(initialConfig?.title || '');
  // For pie/doughnut charts, labels/values are stored instead of xAxis/yAxis
  const [xAxis, setXAxis] = useState(initialConfig?.xAxis || initialConfig?.labels || '');
  const [yAxis, setYAxis] = useState(initialConfig?.yAxis || initialConfig?.values || '');
  const [groupBy, setGroupBy] = useState(initialConfig?.groupBy || '');
  const [aggregation, setAggregation] = useState(initialConfig?.aggregation || 'sum');
  const [colorScheme, setColorScheme] = useState(initialConfig?.colorScheme || 'blue');
  const [showValues, setShowValues] = useState(initialConfig?.showValues || false);
  const [enableZoom, setEnableZoom] = useState(initialConfig?.enableZoom || false);
  const [stacked, setStacked] = useState(initialConfig?.stacked || false);
  const [size, setSize] = useState<'small' | 'medium' | 'large' | 'full'>(initialConfig?.size || 'medium');

  // Auto-apply top suggestion if no initial config
  useEffect(() => {
    if (!initialConfig && suggestions.length > 0) {
      const top = suggestions[0];
      if (top.config.type) setChartType(top.config.type);
      if (top.config.xAxis) setXAxis(top.config.xAxis);
      if (top.config.yAxis) setYAxis(top.config.yAxis);
      if (top.config.aggregation) setAggregation(top.config.aggregation);
      if (top.config.title) setTitle(top.config.title);
    }
  }, [suggestions, initialConfig]);

  // Build current config
  const currentConfig: ChartConfiguration = {
    type: chartType,
    title,
    xAxis: ['pie', 'doughnut'].includes(chartType) ? undefined : xAxis,
    yAxis: ['pie', 'doughnut'].includes(chartType) ? undefined : yAxis,
    labels: ['pie', 'doughnut'].includes(chartType) ? xAxis : undefined,
    values: ['pie', 'doughnut'].includes(chartType) ? yAxis : undefined,
    groupBy: groupBy || undefined,
    aggregation,
    colorScheme,
    showValues,
    enableZoom,
    stacked,
  };

  // Process preview data
  const previewData = useMemo(() => {
    if (!xAxis || !yAxis) return { labels: [], datasets: [] };
    return processChartData(data, currentConfig);
  }, [data, currentConfig, xAxis, yAxis]);

  const previewOptions = useMemo(() => {
    return generateChartOptions(currentConfig);
  }, [currentConfig]);

  // Apply suggestion
  const applySuggestion = (suggestion: typeof suggestions[0]) => {
    if (suggestion.config.type) setChartType(suggestion.config.type);
    if (suggestion.config.xAxis) setXAxis(suggestion.config.xAxis);
    if (suggestion.config.yAxis) setYAxis(suggestion.config.yAxis);
    if (suggestion.config.groupBy) setGroupBy(suggestion.config.groupBy);
    if (suggestion.config.aggregation) setAggregation(suggestion.config.aggregation);
    if (suggestion.config.title) setTitle(suggestion.config.title);
  };

  // Render preview chart
  const renderPreview = () => {
    if (!xAxis || !yAxis) {
      return (
        <div className="flex items-center justify-center h-full text-slate-500">
          Select X and Y axes to see preview
        </div>
      );
    }

    const chartProps: any = {
      data: previewData,
      options: {
        ...previewOptions,
        maintainAspectRatio: true,
        aspectRatio: 1.5,
      },
    };

    switch (chartType) {
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
        return null;
    }
  };

  const handleSave = () => {
    onSave({ ...currentConfig, size });
  };

  return (
    <div className="flex h-full">
      {/* Left Panel: Configuration */}
      <div className="w-96 border-r p-4 overflow-y-auto bg-slate-50">
        <h3 className="font-semibold text-lg mb-4 text-slate-900">Chart Configuration</h3>

        {/* Step 1: Chart Type */}
        <div className="mb-6">
          <Label className="text-sm font-medium mb-2 block">Chart Type</Label>
          <div className="grid grid-cols-2 gap-2">
            {CHART_TYPES.map((type) => {
              const isSuggested = suggestions.some((s) => s.type === type.id);
              return (
                <button
                  key={type.id}
                  onClick={() => setChartType(type.id)}
                  className={`relative p-3 border rounded-lg hover:bg-white transition-all text-left ${
                    chartType === type.id
                      ? 'border-blue-500 bg-blue-50 shadow-sm'
                      : 'border-slate-200 bg-white'
                  }`}
                >
                  {isSuggested && (
                    <Badge className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-1 py-0">
                      Suggested
                    </Badge>
                  )}
                  <type.icon className="h-5 w-5 mb-1 text-slate-700" />
                  <div className="text-xs font-medium text-slate-900">{type.label}</div>
                  <div className="text-[10px] text-slate-500">{type.description}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Smart Suggestions */}
        {suggestions.length > 0 && (
          <div className="mb-6 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-start gap-2 mb-2">
              <Lightbulb className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
              <div>
                <div className="text-xs font-semibold text-amber-900">Smart Suggestion</div>
                <div className="text-xs text-amber-700 mt-1">{suggestions[0].reason}</div>
              </div>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => applySuggestion(suggestions[0])}
              className="w-full mt-2 text-xs h-7"
            >
              Apply Suggestion →
            </Button>
          </div>
        )}

        {/* Step 2: Data Configuration */}
        <div className="space-y-4 mb-6">
          <div>
            <Label className="text-sm font-medium">{['pie', 'doughnut'].includes(chartType) ? 'Labels' : 'X-Axis'}</Label>
            <Select value={xAxis} onValueChange={setXAxis}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select column" />
              </SelectTrigger>
              <SelectContent>
                {columns.map((col) => (
                  <SelectItem key={col} value={col}>
                    {col}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-sm font-medium">{['pie', 'doughnut'].includes(chartType) ? 'Values' : 'Y-Axis'}</Label>
            <Select value={yAxis} onValueChange={setYAxis}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select column" />
              </SelectTrigger>
              <SelectContent>
                {analysis.numericColumns.map((col) => (
                  <SelectItem key={col} value={col}>
                    {col}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-sm font-medium">Aggregation</Label>
            <Select value={aggregation} onValueChange={(value) => setAggregation(value as any)}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sum">Sum</SelectItem>
                <SelectItem value="average">Average</SelectItem>
                <SelectItem value="count">Count</SelectItem>
                <SelectItem value="min">Minimum</SelectItem>
                <SelectItem value="max">Maximum</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {!['pie', 'doughnut'].includes(chartType) && (
            <div>
              <Label className="text-sm font-medium">Group By (Optional)</Label>
              <div className="space-y-2">
                <Select value={groupBy || undefined} onValueChange={setGroupBy}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="None - No grouping" />
                  </SelectTrigger>
                  <SelectContent>
                    {analysis.categoricalColumns.map((col) => (
                      <SelectItem key={col} value={col}>
                        {col}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {groupBy && (
                  <button
                    onClick={() => setGroupBy('')}
                    className="text-xs text-blue-600 hover:text-blue-700"
                  >
                    Clear grouping
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Step 3: Visual Customization */}
        <div className="space-y-4 mb-6">
          <div>
            <Label className="text-sm font-medium">Chart Title</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter chart title"
              className="mt-1"
            />
          </div>

          <div>
            <Label className="text-sm font-medium mb-2 block">Color Scheme</Label>
            <div className="grid grid-cols-4 gap-2">
              {COLOR_SCHEMES.map((scheme) => (
                <button
                  key={scheme.id}
                  onClick={() => setColorScheme(scheme.id)}
                  className={`h-8 rounded border-2 transition-all ${
                    colorScheme === scheme.id ? 'border-blue-500 ring-2 ring-blue-200' : 'border-slate-200'
                  }`}
                  style={{
                    background: `linear-gradient(90deg, ${scheme.colors.join(', ')})`,
                  }}
                  title={scheme.name}
                />
              ))}
            </div>
          </div>

          <div>
            <Label className="text-sm font-medium mb-2 block">Chart Size</Label>
            <div className="grid grid-cols-4 gap-2">
              {['small', 'medium', 'large', 'full'].map((s) => (
                <button
                  key={s}
                  onClick={() => setSize(s as any)}
                  className={`px-3 py-2 text-xs border rounded capitalize ${
                    size === s
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-slate-200 bg-white text-slate-700'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="showValues"
                checked={showValues}
                onCheckedChange={(checked) => setShowValues(checked as boolean)}
              />
              <Label htmlFor="showValues" className="text-sm cursor-pointer">
                Show values on chart
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="enableZoom"
                checked={enableZoom}
                onCheckedChange={(checked) => setEnableZoom(checked as boolean)}
              />
              <Label htmlFor="enableZoom" className="text-sm cursor-pointer">
                Enable zoom & pan
              </Label>
            </div>

            {['bar', 'area'].includes(chartType) && (
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="stacked"
                  checked={stacked}
                  onCheckedChange={(checked) => setStacked(checked as boolean)}
                />
                <Label htmlFor="stacked" className="text-sm cursor-pointer">
                  Stack series
                </Label>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-4 border-t">
          <Button onClick={handleSave} className="flex-1">
            <Save className="h-4 w-4 mr-2" />
            Save Chart
          </Button>
          <Button variant="outline" onClick={onCancel}>
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
        </div>
      </div>

      {/* Right Panel: Live Preview */}
      <div className="flex-1 p-6 bg-white">
        <div className="h-full flex flex-col">
          <div className="mb-4">
            <h3 className="font-semibold text-lg text-slate-900">Live Preview</h3>
            <p className="text-sm text-slate-600">See how your chart will look</p>
          </div>

          <div className="flex-1 border rounded-lg p-4 bg-slate-50 flex items-center justify-center">
            {renderPreview()}
          </div>
        </div>
      </div>
    </div>
  );
}
