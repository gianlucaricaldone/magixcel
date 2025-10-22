import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend,
  Filler,
  ChartOptions,
} from 'chart.js';

// Dynamic imports for plugins to avoid SSR issues
let ChartDataLabels: any;
let zoomPlugin: any;

// Register all Chart.js components only on client side
if (typeof window !== 'undefined') {
  // Dynamically import plugins
  import('chartjs-plugin-datalabels').then((module) => {
    ChartDataLabels = module.default;
    if (ChartDataLabels) {
      ChartJS.register(ChartDataLabels);
    }
  });

  import('chartjs-plugin-zoom').then((module) => {
    zoomPlugin = module.default;
    if (zoomPlugin) {
      ChartJS.register(zoomPlugin);
    }
  });

  // Register core components
  ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    RadialLinearScale,
    Title,
    Tooltip,
    Legend,
    Filler
  );
}

// Default chart options
export const defaultChartOptions: ChartOptions<any> = {
  responsive: true,
  maintainAspectRatio: true,
  aspectRatio: 2,
  plugins: {
    legend: {
      position: 'top' as const,
      labels: {
        usePointStyle: true,
        padding: 15,
        font: {
          size: 12,
        },
      },
    },
    tooltip: {
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      padding: 12,
      titleFont: {
        size: 14,
      },
      bodyFont: {
        size: 13,
      },
      cornerRadius: 6,
      displayColors: true,
      callbacks: {
        label: function(context) {
          let label = context.dataset.label || '';
          if (label) {
            label += ': ';
          }
          if (context.parsed.y !== null) {
            label += new Intl.NumberFormat('en-US').format(context.parsed.y);
          }
          return label;
        },
      },
    },
    datalabels: {
      display: false, // Disabled by default, enable per chart
    } as any,
  },
  interaction: {
    mode: 'index' as const,
    intersect: false,
  },
};

// Chart.js is now registered and ready to use
export { ChartJS };
