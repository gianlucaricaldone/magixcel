import { ChartConfiguration, COLOR_SCHEMES } from '@/types/charts';
import { ChartData } from 'chart.js';
import { groupBy, aggregate } from './data-analysis';

/**
 * Process raw data into Chart.js compatible format based on configuration
 */
export function processChartData(
  data: any[],
  config: ChartConfiguration
): ChartData {
  if (!data || data.length === 0) {
    return { labels: [], datasets: [] };
  }

  const { type } = config;

  switch (type) {
    case 'bar':
    case 'line':
    case 'area':
      return processCartesianData(data, config);

    case 'pie':
    case 'doughnut':
      return processPieData(data, config);

    case 'scatter':
    case 'bubble':
      return processScatterData(data, config);

    case 'radar':
      return processRadarData(data, config);

    default:
      return { labels: [], datasets: [] };
  }
}

/**
 * Process data for bar, line, and area charts
 */
function processCartesianData(
  data: any[],
  config: ChartConfiguration
): ChartData {
  const { xAxis, yAxis, groupBy: groupByColumn, aggregation } = config;

  if (!xAxis || !yAxis) {
    return { labels: [], datasets: [] };
  }

  // Group data by x-axis
  const grouped = groupBy(data, xAxis);
  const labels = Object.keys(grouped).sort();

  const colors = getColors(config.colorScheme || 'blue');

  if (!groupByColumn) {
    // Single series
    const values = labels.map((label) =>
      aggregate(grouped[label], yAxis, aggregation)
    );

    return {
      labels,
      datasets: [
        {
          label: yAxis,
          data: values,
          borderColor: colors[0],
          backgroundColor: config.type === 'line' ? `${colors[0]}20` : colors[0],
          fill: config.type === 'area',
          tension: 0.4,
        },
      ],
    };
  } else {
    // Multi-series
    const series = groupBy(data, groupByColumn);
    const seriesNames = Object.keys(series).sort();

    const datasets = seriesNames.map((seriesName, index) => {
      const seriesData = series[seriesName];
      const values = labels.map((label) => {
        const items = seriesData.filter((d: any) => String(d[xAxis]) === String(label));
        return aggregate(items, yAxis, aggregation);
      });

      return {
        label: seriesName,
        data: values,
        borderColor: colors[index % colors.length],
        backgroundColor: config.type === 'line'
          ? `${colors[index % colors.length]}20`
          : colors[index % colors.length],
        fill: config.type === 'area',
        tension: 0.4,
      };
    });

    return { labels, datasets };
  }
}

/**
 * Process data for pie and doughnut charts
 */
function processPieData(
  data: any[],
  config: ChartConfiguration
): ChartData {
  const { labels: labelsColumn, values: valuesColumn, aggregation } = config;

  if (!labelsColumn || !valuesColumn) {
    return { labels: [], datasets: [] };
  }

  // Group by labels column
  const grouped = groupBy(data, labelsColumn);
  const labels = Object.keys(grouped);

  const values = labels.map((label) =>
    aggregate(grouped[label], valuesColumn, aggregation)
  );

  const colors = getColors(config.colorScheme || 'rainbow', labels.length);

  return {
    labels,
    datasets: [
      {
        label: valuesColumn,
        data: values,
        backgroundColor: colors,
        borderColor: '#ffffff',
        borderWidth: 2,
      },
    ],
  };
}

/**
 * Process data for scatter and bubble charts
 */
function processScatterData(
  data: any[],
  config: ChartConfiguration
): ChartData {
  const { xAxis, yAxis, groupBy: groupByColumn } = config;

  if (!xAxis || !yAxis) {
    return { labels: [], datasets: [] };
  }

  const colors = getColors(config.colorScheme || 'blue');

  if (!groupByColumn) {
    // Single series
    const points = data.map((row) => ({
      x: parseFloat(row[xAxis]) || 0,
      y: parseFloat(row[yAxis]) || 0,
    }));

    return {
      datasets: [
        {
          label: `${xAxis} vs ${yAxis}`,
          data: points,
          backgroundColor: colors[0],
          borderColor: colors[0],
        },
      ],
    };
  } else {
    // Multi-series
    const series = groupBy(data, groupByColumn);
    const seriesNames = Object.keys(series);

    const datasets = seriesNames.map((seriesName, index) => {
      const points = series[seriesName].map((row: any) => ({
        x: parseFloat(row[xAxis]) || 0,
        y: parseFloat(row[yAxis]) || 0,
      }));

      return {
        label: seriesName,
        data: points,
        backgroundColor: colors[index % colors.length],
        borderColor: colors[index % colors.length],
      };
    });

    return { datasets };
  }
}

/**
 * Process data for radar charts
 */
function processRadarData(
  data: any[],
  config: ChartConfiguration
): ChartData {
  const { xAxis, yAxis, groupBy: groupByColumn, aggregation } = config;

  if (!xAxis || !yAxis) {
    return { labels: [], datasets: [] };
  }

  // Same as cartesian, but for radar visualization
  return processCartesianData(data, config);
}

/**
 * Get colors from a color scheme
 */
function getColors(schemeId: string, count?: number): string[] {
  const scheme = COLOR_SCHEMES.find((s) => s.id === schemeId) || COLOR_SCHEMES[0];

  if (!count) {
    return scheme.colors;
  }

  // If we need more colors than available, repeat the pattern
  const colors: string[] = [];
  for (let i = 0; i < count; i++) {
    colors.push(scheme.colors[i % scheme.colors.length]);
  }

  return colors;
}

/**
 * Generate Chart.js options based on configuration
 */
export function generateChartOptions(config: ChartConfiguration): any {
  const baseOptions: any = {
    responsive: true,
    maintainAspectRatio: true,
    aspectRatio: 2,
    plugins: {
      title: {
        display: !!config.title,
        text: config.title || '',
        font: {
          size: 16,
          weight: 'bold',
        },
      },
      legend: {
        display: true,
        position: 'top',
      },
      tooltip: {
        enabled: true,
      },
      datalabels: {
        display: config.showValues || false,
        color: '#1F2937',
        font: {
          weight: 'bold',
          size: 11,
        },
        formatter: (value: any) => {
          if (typeof value === 'number') {
            return new Intl.NumberFormat('en-US').format(value);
          }
          return value;
        },
      },
    },
  };

  // Add stacking for bar/area charts
  if (config.stacked && (config.type === 'bar' || config.type === 'area')) {
    baseOptions.scales = {
      x: {
        stacked: true,
      },
      y: {
        stacked: true,
      },
    };
  }

  // Add zoom plugin if enabled
  if (config.enableZoom) {
    baseOptions.plugins.zoom = {
      zoom: {
        wheel: {
          enabled: true,
        },
        pinch: {
          enabled: true,
        },
        mode: 'xy',
      },
      pan: {
        enabled: true,
        mode: 'xy',
      },
    };
  }

  return baseOptions;
}
