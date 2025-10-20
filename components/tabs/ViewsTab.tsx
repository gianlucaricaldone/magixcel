'use client';

import { useState, useEffect } from 'react';
import { IView } from '@/types/database';
import { ViewsSidebar } from '@/components/views/ViewsSidebar';
import { ActiveViewPanel } from '@/components/views/ActiveViewPanel';
import { Layers } from 'lucide-react';

interface ViewsTabProps {
  views: IView[];
  currentView: IView | null;
  data: any[];
  columns: string[];
  columnCount: number;
  onSelectView: (view: IView) => void;
  onCreateView: () => void;
  onUpdateView: (viewId: string, updates: Partial<IView>) => void;
  chartCounts?: Record<string, number>;
}

export function ViewsTab({
  views,
  currentView,
  data,
  columns,
  columnCount,
  onSelectView,
  onCreateView,
  onUpdateView,
  chartCounts,
}: ViewsTabProps) {
  const [lastSaved, setLastSaved] = useState<Date | undefined>();

  // Update last saved when view changes
  useEffect(() => {
    if (currentView) {
      setLastSaved(new Date());
    }
  }, [currentView]);

  const handleUpdateView = (updates: Partial<IView>) => {
    if (currentView) {
      onUpdateView(currentView.id, updates);
      setLastSaved(new Date());
    }
  };

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* Sidebar */}
      <ViewsSidebar
        views={views}
        currentViewId={currentView?.id}
        onSelectView={onSelectView}
        onCreateView={onCreateView}
        chartCounts={chartCounts}
      />

      {/* Main Panel */}
      {currentView ? (
        <ActiveViewPanel
          view={currentView}
          data={data}
          columns={columns}
          columnCount={columnCount}
          onUpdateView={handleUpdateView}
          lastSaved={lastSaved}
        />
      ) : (
        <div className="flex-1 flex items-center justify-center bg-slate-50">
          <div className="text-center max-w-md p-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
              <Layers className="h-8 w-8 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold text-slate-900 mb-2">
              No View Selected
            </h3>
            <p className="text-slate-600 mb-4">
              Select a view from the sidebar or create a new one to start building your dashboard.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
