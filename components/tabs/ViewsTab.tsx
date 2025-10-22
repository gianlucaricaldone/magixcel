'use client';

import { useState, useEffect } from 'react';
import { IView, IActiveView } from '@/types/database';
import { ViewsSidebar } from '@/components/views/ViewsSidebar';
import { ActiveViewPanel } from '@/components/views/ActiveViewPanel';
import { Layers, CheckSquare } from 'lucide-react';

interface ViewsTabProps {
  views: IView[];
  activeViewIds: string[]; // Changed: multi-selection instead of single currentView
  sessionId: string;
  activeSheet: string | null;
  data: any[];
  columns: string[];
  columnCount: number;
  onToggleView: (viewId: string) => void; // Changed: toggle instead of select
  onCreateView: () => void;
  onUpdateView: (viewId: string, updates: Partial<IView>) => void;
  onDeleteView: (viewId: string) => void;
  onEditFilters: (viewId: string) => void;
  chartCounts?: Record<string, number>;
}

export function ViewsTab({
  views,
  activeViewIds,
  sessionId,
  activeSheet,
  data,
  columns,
  columnCount,
  onToggleView,
  onCreateView,
  onUpdateView,
  onDeleteView,
  onEditFilters,
  chartCounts,
}: ViewsTabProps) {
  const [selectedViewId, setSelectedViewId] = useState<string | null>(null);

  // Get selected view for detail panel
  const selectedView = views.find(v => v.id === selectedViewId) || null;

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* Sidebar with multi-select checkboxes */}
      <ViewsSidebar
        views={views}
        activeViewIds={activeViewIds}
        selectedViewId={selectedViewId}
        onToggleView={onToggleView}
        onSelectView={setSelectedViewId}
        onCreateView={onCreateView}
        chartCounts={chartCounts}
      />

      {/* Main Panel - Shows selected view for editing */}
      {selectedView ? (
        <ActiveViewPanel
          view={selectedView}
          data={data}
          columns={columns}
          columnCount={columnCount}
          onUpdateView={(updates) => onUpdateView(selectedView.id, updates)}
          onDeleteView={() => {
            onDeleteView(selectedView.id);
            setSelectedViewId(null);
          }}
          onEditFilters={() => onEditFilters(selectedView.id)}
        />
      ) : (
        <div className="flex-1 flex items-center justify-center bg-slate-50">
          <div className="text-center max-w-md p-8">
            {activeViewIds.length > 0 ? (
              <>
                <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                  <CheckSquare className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-2">
                  {activeViewIds.length} View{activeViewIds.length > 1 ? 's' : ''} Active
                </h3>
                <p className="text-slate-600 mb-4">
                  Filters from active views are applied in AND.
                  Click on a view name to see details and charts.
                </p>
              </>
            ) : (
              <>
                <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                  <Layers className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-2">
                  No Views Active
                </h3>
                <p className="text-slate-600 mb-4">
                  Check views from the sidebar to apply their filters.
                  Click on a view name to see details and charts.
                </p>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
