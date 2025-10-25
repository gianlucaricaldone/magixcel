'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ViewDashboard } from '@/components/charts/ViewDashboard';
import { IView } from '@/types/database';
import { Loader2, ArrowLeft, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ViewDashboardPage() {
  const params = useParams();
  const router = useRouter();
  const viewId = params.id as string;

  const [view, setView] = useState<IView | null>(null);
  const [data, setData] = useState<any[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadViewAndData();
  }, [viewId]);

  const loadViewAndData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Load view
      const viewResponse = await fetch(`/api/views/${viewId}`);
      const viewResult = await viewResponse.json();

      if (!viewResult.success) {
        throw new Error(viewResult.error || 'Failed to load view');
      }

      const loadedView: IView = viewResult.view;
      setView(loadedView);

      // Load data based on view type
      if (loadedView.view_type === 'snapshot' && loadedView.snapshot_data) {
        // Snapshot view - data is stored in the view
        // snapshot_data is already deserialized by the adapter
        const snapshotData = loadedView.snapshot_data;
        setData(snapshotData);

        if (snapshotData.length > 0) {
          setColumns(Object.keys(snapshotData[0]));
        }
      } else if (loadedView.view_type === 'filters_only' && loadedView.session_id) {
        // Filters view - need to load session data and apply filters
        const sessionResponse = await fetch(`/api/session/${loadedView.session_id}/data`);
        const sessionResult = await sessionResponse.json();

        if (!sessionResult.success) {
          throw new Error('Failed to load session data');
        }

        let sessionData = sessionResult.data;

        // Apply filters from view
        // filter_config is already deserialized by the adapter
        const filterConfig = loadedView.filter_config;
        if (filterConfig.filters && filterConfig.filters.length > 0) {
          sessionData = applyFilters(sessionData, filterConfig.filters);
        }

        setData(sessionData);

        if (sessionData.length > 0) {
          setColumns(Object.keys(sessionData[0]));
        }
      } else {
        // No data available
        setData([]);
        setColumns([]);
      }
    } catch (err: any) {
      console.error('Error loading view:', err);
      setError(err.message || 'Failed to load view');
    } finally {
      setIsLoading(false);
    }
  };

  // Simple filter application (basic version)
  const applyFilters = (data: any[], filters: any[]) => {
    let result = data;

    filters.forEach((filter) => {
      if (!filter.column || !filter.operator) return;

      result = result.filter((row) => {
        const value = row[filter.column];
        const filterValue = filter.value;

        switch (filter.operator) {
          case 'equals':
            return String(value) === String(filterValue);
          case 'not_equals':
            return String(value) !== String(filterValue);
          case 'contains':
            return String(value).toLowerCase().includes(String(filterValue).toLowerCase());
          case 'not_contains':
            return !String(value).toLowerCase().includes(String(filterValue).toLowerCase());
          case 'starts_with':
            return String(value).toLowerCase().startsWith(String(filterValue).toLowerCase());
          case 'ends_with':
            return String(value).toLowerCase().endsWith(String(filterValue).toLowerCase());
          case 'greater_than':
            return Number(value) > Number(filterValue);
          case 'less_than':
            return Number(value) < Number(filterValue);
          case 'is_empty':
            return value === null || value === undefined || value === '';
          case 'is_not_empty':
            return value !== null && value !== undefined && value !== '';
          default:
            return true;
        }
      });
    });

    return result;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-lg text-slate-600">Loading view...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center max-w-md">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
            <AlertCircle className="h-8 w-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Error</h2>
          <p className="text-slate-600 mb-4">{error}</p>
          <Button onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  if (!view) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center max-w-md">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-100 rounded-full mb-4">
            <AlertCircle className="h-8 w-8 text-slate-400" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">View Not Found</h2>
          <p className="text-slate-600 mb-4">The requested view could not be found.</p>
          <Button onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Navigation Header */}
      <div className="bg-white border-b px-6 py-3">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div className="h-6 w-px bg-slate-300" />
          <div className="flex-1">
            <h1 className="text-lg font-semibold text-slate-900">Dashboard View</h1>
          </div>
        </div>
      </div>

      {/* Dashboard Content */}
      <div className="flex-1 overflow-hidden">
        <ViewDashboard view={view} data={data} columns={columns} />
      </div>
    </div>
  );
}
