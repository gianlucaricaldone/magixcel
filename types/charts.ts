export type ChartType =
  | 'bar'
  | 'line'
  | 'pie'
  | 'doughnut'
  | 'scatter'
  | 'area'
  | 'radar'
  | 'bubble'
  | 'heatmap'
  | 'gauge'
  | 'waterfall'
  | 'funnel';

export type ChartSize = 'small' | 'medium' | 'large' | 'full';

export type AggregationType = 'sum' | 'average' | 'count' | 'min' | 'max' | 'none';

export interface ChartConfiguration {
  type: ChartType;
  xAxis?: string;
  yAxis?: string;
  labels?: string;
  values?: string;
  groupBy?: string;
  aggregation: AggregationType;
  title?: string;
  colorScheme?: string;
  showValues?: boolean;
  enableZoom?: boolean;
  stacked?: boolean;
  options?: any; // Chart.js options
}

export interface ViewChart {
  id: string;
  view_id: string;
  chart_type: ChartType;
  title: string;
  config: string; // JSON serialized ChartConfiguration
  position: number;
  size: ChartSize;
  created_at: string;
  updated_at: string;
}

export interface DashboardLayout {
  columns: number;
  gap: number;
  charts: {
    id: string;
    x: number;
    y: number;
    w: number;
    h: number;
  }[];
}

export interface ChartSuggestion {
  type: ChartType;
  config: Partial<ChartConfiguration>;
  score: number;
  reason: string;
}

export interface ChartDataAnalysis {
  hasDateColumn: boolean;
  hasNumericColumn: boolean;
  dateColumns: string[];
  numericColumns: string[];
  categoricalColumns: string[];
  rowCount: number;
  columnCount: number;
}

export interface ColorScheme {
  id: string;
  name: string;
  colors: string[];
}

export const COLOR_SCHEMES: ColorScheme[] = [
  {
    id: 'blue',
    name: 'Blue',
    colors: ['#3B82F6', '#60A5FA', '#93C5FD', '#DBEAFE']
  },
  {
    id: 'green',
    name: 'Green',
    colors: ['#10B981', '#34D399', '#6EE7B7', '#D1FAE5']
  },
  {
    id: 'purple',
    name: 'Purple',
    colors: ['#8B5CF6', '#A78BFA', '#C4B5FD', '#EDE9FE']
  },
  {
    id: 'rainbow',
    name: 'Rainbow',
    colors: ['#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899']
  },
  {
    id: 'warm',
    name: 'Warm',
    colors: ['#DC2626', '#EA580C', '#F59E0B', '#EAB308']
  },
  {
    id: 'cool',
    name: 'Cool',
    colors: ['#0891B2', '#0284C7', '#2563EB', '#4F46E5']
  },
  {
    id: 'monochrome',
    name: 'Monochrome',
    colors: ['#1F2937', '#4B5563', '#6B7280', '#9CA3AF', '#D1D5DB']
  },
  {
    id: 'pastel',
    name: 'Pastel',
    colors: ['#FBCFE8', '#BFDBFE', '#BBF7D0', '#FED7AA', '#DDD6FE']
  }
];
