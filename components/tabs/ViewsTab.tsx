'use client';

import { useState } from 'react';
import { IView } from '@/types/database';
import { ViewsSidebar } from '@/components/views/ViewsSidebar';
import { ViewsMainPanel } from '@/components/views/ViewsMainPanel';
import { EditViewDrawer } from '@/components/views/EditViewDrawer';

interface ViewsTabProps {
  views: IView[];
  activeViewIds: string[]; // Changed: multi-selection instead of single currentView
  sessionId: string;
  workspaceId: string;
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
  workspaceId,
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
  const [editingViewId, setEditingViewId] = useState<string | null>(null);

  // Get editing view
  const editingView = views.find(v => v.id === editingViewId) || null;

  // Create a key that includes the view's updated_at to force re-render when view changes
  const drawerKey = editingView
    ? `${editingView.id}-${editingView.updated_at}`
    : 'closed';

  return (
    <>
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar with multi-select checkboxes */}
        <ViewsSidebar
          views={views}
          activeViewIds={activeViewIds}
          selectedViewId={editingViewId}
          onToggleView={onToggleView}
          onSelectView={setEditingViewId}
          onCreateView={onCreateView}
          chartCounts={chartCounts}
        />

        {/* Main Panel - Always visible with Data/Charts tabs */}
        <ViewsMainPanel
          data={data}
          columns={columns}
          columnCount={columnCount}
          activeViewIds={activeViewIds}
          views={views}
          sessionId={sessionId}
          workspaceId={workspaceId}
        />
      </div>

      {/* Edit View Drawer - Slides from right */}
      <EditViewDrawer
        key={drawerKey}
        view={editingView}
        isOpen={editingViewId !== null}
        onClose={() => setEditingViewId(null)}
        onUpdateView={(updates) => {
          if (editingViewId) {
            onUpdateView(editingViewId, updates);
          }
        }}
        onDeleteView={() => {
          if (editingViewId) {
            onDeleteView(editingViewId);
            setEditingViewId(null);
          }
        }}
        onEditFilters={() => {
          if (editingViewId) {
            // Close drawer before opening filter modal
            const viewId = editingViewId;
            setEditingViewId(null);
            // Small delay to let drawer close
            setTimeout(() => {
              onEditFilters(viewId);
            }, 300);
          }
        }}
      />
    </>
  );
}
