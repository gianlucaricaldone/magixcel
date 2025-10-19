import { ChartSuggestion, ChartDataAnalysis } from '@/types/charts';
import {
  analyzeData,
  getUniqueValues,
  calculateTarget,
} from './data-analysis';

/**
 * Generate smart chart suggestions based on data analysis
 */
export function suggestCharts(data: any[], columns: string[]): ChartSuggestion[] {
  if (!data || data.length === 0 || !columns || columns.length === 0) {
    return [];
  }

  const suggestions: ChartSuggestion[] = [];
  const analysis = analyzeData(data, columns);

  // Rule 1: Time series → Line chart (highest priority)
  if (analysis.hasDateColumn && analysis.hasNumericColumn) {
    suggestions.push({
      type: 'line',
      config: {
        type: 'line',
        xAxis: analysis.dateColumns[0],
        yAxis: analysis.numericColumns[0],
        aggregation: 'sum',
        title: `${analysis.numericColumns[0]} over time`,
        enableZoom: true,
      },
      score: 0.95,
      reason: `Perfect for showing ${analysis.numericColumns[0]} trend over time`,
    });

    // Also suggest area chart for time series
    if (analysis.numericColumns.length >= 1) {
      suggestions.push({
        type: 'area',
        config: {
          type: 'area',
          xAxis: analysis.dateColumns[0],
          yAxis: analysis.numericColumns[0],
          aggregation: 'sum',
          title: `${analysis.numericColumns[0]} trend`,
        },
        score: 0.85,
        reason: `Show cumulative ${analysis.numericColumns[0]} over time`,
      });
    }
  }

  // Rule 2: Categories + Values → Bar chart
  if (analysis.categoricalColumns.length > 0 && analysis.numericColumns.length > 0) {
    const uniqueValues = getUniqueValues(data, analysis.categoricalColumns[0]);

    if (uniqueValues.length > 0 && uniqueValues.length <= 20) {
      suggestions.push({
        type: 'bar',
        config: {
          type: 'bar',
          xAxis: analysis.categoricalColumns[0],
          yAxis: analysis.numericColumns[0],
          aggregation: 'sum',
          title: `${analysis.numericColumns[0]} by ${analysis.categoricalColumns[0]}`,
        },
        score: 0.90,
        reason: `Compare ${analysis.numericColumns[0]} across different ${analysis.categoricalColumns[0]}`,
      });

      // If there's a second categorical column, suggest grouping
      if (analysis.categoricalColumns.length > 1) {
        suggestions.push({
          type: 'bar',
          config: {
            type: 'bar',
            xAxis: analysis.categoricalColumns[0],
            yAxis: analysis.numericColumns[0],
            groupBy: analysis.categoricalColumns[1],
            aggregation: 'sum',
            title: `${analysis.numericColumns[0]} by ${analysis.categoricalColumns[0]} and ${analysis.categoricalColumns[1]}`,
            stacked: false,
          },
          score: 0.87,
          reason: `Compare ${analysis.numericColumns[0]} grouped by ${analysis.categoricalColumns[1]}`,
        });
      }
    }
  }

  // Rule 3: Part-of-whole → Pie/Doughnut chart
  if (analysis.categoricalColumns.length > 0 && analysis.numericColumns.length > 0) {
    const uniqueValues = getUniqueValues(data, analysis.categoricalColumns[0]);

    if (uniqueValues.length > 0 && uniqueValues.length <= 8) {
      suggestions.push({
        type: 'pie',
        config: {
          type: 'pie',
          labels: analysis.categoricalColumns[0],
          values: analysis.numericColumns[0],
          aggregation: 'sum',
          title: `Distribution of ${analysis.numericColumns[0]}`,
        },
        score: 0.85,
        reason: `Show distribution of ${analysis.numericColumns[0]} by ${analysis.categoricalColumns[0]}`,
      });

      suggestions.push({
        type: 'doughnut',
        config: {
          type: 'doughnut',
          labels: analysis.categoricalColumns[0],
          values: analysis.numericColumns[0],
          aggregation: 'sum',
          title: `${analysis.numericColumns[0]} breakdown`,
        },
        score: 0.83,
        reason: `Visualize ${analysis.numericColumns[0]} proportions`,
      });
    }
  }

  // Rule 4: Two numeric columns → Scatter plot
  if (analysis.numericColumns.length >= 2) {
    suggestions.push({
      type: 'scatter',
      config: {
        type: 'scatter',
        xAxis: analysis.numericColumns[0],
        yAxis: analysis.numericColumns[1],
        aggregation: 'none',
        title: `${analysis.numericColumns[0]} vs ${analysis.numericColumns[1]}`,
      },
      score: 0.80,
      reason: `Explore correlation between ${analysis.numericColumns[0]} and ${analysis.numericColumns[1]}`,
    });

    // If there's a categorical column, suggest grouping
    if (analysis.categoricalColumns.length > 0) {
      suggestions.push({
        type: 'scatter',
        config: {
          type: 'scatter',
          xAxis: analysis.numericColumns[0],
          yAxis: analysis.numericColumns[1],
          groupBy: analysis.categoricalColumns[0],
          aggregation: 'none',
          title: `${analysis.numericColumns[0]} vs ${analysis.numericColumns[1]} by ${analysis.categoricalColumns[0]}`,
        },
        score: 0.78,
        reason: `Explore correlation with ${analysis.categoricalColumns[0]} grouping`,
      });
    }
  }

  // Rule 5: Multiple metrics → Radar chart
  if (analysis.numericColumns.length >= 3 && analysis.categoricalColumns.length > 0) {
    const uniqueValues = getUniqueValues(data, analysis.categoricalColumns[0]);

    if (uniqueValues.length > 0 && uniqueValues.length <= 10) {
      suggestions.push({
        type: 'radar',
        config: {
          type: 'radar',
          xAxis: analysis.categoricalColumns[0],
          yAxis: analysis.numericColumns[0],
          aggregation: 'average',
          title: `Multi-dimensional comparison`,
        },
        score: 0.75,
        reason: `Compare multiple dimensions across ${analysis.categoricalColumns[0]}`,
      });
    }
  }

  // Rule 6: Single KPI → Gauge (if small dataset)
  if (analysis.numericColumns.length > 0 && data.length < 100) {
    suggestions.push({
      type: 'gauge',
      config: {
        type: 'gauge',
        values: analysis.numericColumns[0],
        aggregation: 'sum',
        title: `${analysis.numericColumns[0]} KPI`,
      },
      score: 0.70,
      reason: `Display ${analysis.numericColumns[0]} as a key performance indicator`,
    });
  }

  // Sort by score descending
  return suggestions.sort((a, b) => b.score - a.score);
}

/**
 * Get the top suggestion
 */
export function getTopSuggestion(data: any[], columns: string[]): ChartSuggestion | null {
  const suggestions = suggestCharts(data, columns);
  return suggestions.length > 0 ? suggestions[0] : null;
}

/**
 * Get suggestions filtered by chart type
 */
export function getSuggestionsByType(
  data: any[],
  columns: string[],
  chartType: string
): ChartSuggestion[] {
  const suggestions = suggestCharts(data, columns);
  return suggestions.filter((s) => s.type === chartType);
}
