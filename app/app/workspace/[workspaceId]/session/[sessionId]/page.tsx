'use client';

import { useEffect, useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSessionStore } from '@/stores/session-store';
import { useDataStore } from '@/stores/data-store';
import { useFilterStore } from '@/stores/filter-store';
import { TopBar } from '@/components/dashboard/TopBar';
import { StatusBar } from '@/components/dashboard/StatusBar';
import { SheetTabs } from '@/components/dashboard/SheetTabs';
import { WorkspaceToolbar } from '@/components/workspace/WorkspaceToolbar';
import { ViewSheetTabs } from '@/components/workspace/ViewSheetTabs';
import { ViewSplitLayout } from '@/components/workspace/ViewSplitLayout';
import { ViewPickerDialog } from '@/components/workspace/ViewPickerDialog';
import { FilterBuilder } from '@/components/filters/FilterBuilder';
import { DataTable } from '@/components/table/DataTable';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { applyFilters } from '@/lib/processing/filter-engine';
import { IView } from '@/types/database';

export default function SessionPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.sessionId as string;
  const workspaceId = params.workspaceId as string;

  const { setSession, metadata, setLoading, setError } = useSessionStore();
  const { data, setData, setSheets, sheets, activeSheet, setActiveSheet: setDataActiveSheet } = useDataStore();
  const { loadViews, saveView, views, getFilterConfig } = useFilterStore();

  const [isLoadingSession, setIsLoadingSession] = useState(true);
  const [workspaceName, setWorkspaceName] = useState<string>('');
  const [sessionName, setSessionName] = useState<string>('');

  // New state for workspace-style UI
  const [openViews, setOpenViews] = useState<IView[]>([]);
  const [activeViewId, setActiveViewId] = useState<string | null>(null);
  const [isViewPickerOpen, setIsViewPickerOpen] = useState(false);
  const [isCreateViewOpen, setIsCreateViewOpen] = useState(false);
  const [viewName, setViewName] = useState('');
  const [viewDescription, setViewDescription] = useState('');
  const [viewCategory, setViewCategory] = useState('Custom');

  // Columns from data
  const columns = useMemo(() => {
    return data.length > 0 ? Object.keys(data[0]) : [];
  }, [data]);

  const columnCount = columns.length;

  // Load workspace and session metadata
  useEffect(() => {
    const loadSessionData = async () => {
      setIsLoadingSession(true);

      try {
        // Load workspace
        const workspaceResponse = await fetch(`/api/workspace/${workspaceId}`);
        const workspaceResult = await workspaceResponse.json();
        if (workspaceResult.success && workspaceResult.data) {
          setWorkspaceName(workspaceResult.data.name);
        }

        // Load session
        const sessionResponse = await fetch(`/api/session/${sessionId}`);
        const sessionResult = await sessionResponse.json();

        if (sessionResult.success && sessionResult.data) {
          const session = sessionResult.data;
          // setSession expects (sessionId, metadata) not the whole session object
          setSession(session.id, session.metadata);
          setSessionName(session.name);

          // Load data.json
          const dataResponse = await fetch(`/api/session/${sessionId}/data`);
          const dataResult = await dataResponse.json();

          if (dataResult.success) {
            setData(dataResult.data);

            // Handle sheets (Excel files)
            if (session.file_type === 'xlsx' || session.file_type === 'xls') {
              try {
                const sheetsResponse = await fetch(`/api/session/${sessionId}/sheets`);
                const sheetsResult = await sheetsResponse.json();

                if (sheetsResult.success && sheetsResult.sheets && sheetsResult.sheets.length > 0) {
                  setSheets(sheetsResult.sheets);
                  const firstSheetName = sheetsResult.sheets[0].sheetName;
                  setDataActiveSheet(firstSheetName);
                }
              } catch (error) {
                console.warn('Error loading sheets:', error);
              }
            }
          }
        }
      } catch (error) {
        console.error('Error loading session:', error);
        setError('Failed to load session');
      } finally {
        setIsLoadingSession(false);
      }
    };

    if (sessionId && workspaceId) {
      loadSessionData();
    }
  }, [sessionId, workspaceId, setSession, setData, setSheets, setDataActiveSheet, setError]);

  // Load all views for this workspace/session
  useEffect(() => {
    if (workspaceId && sessionId) {
      loadViews(workspaceId, sessionId);
    }
  }, [workspaceId, sessionId, loadViews]);

  // Restore open views from database or auto-open "All Data" view
  useEffect(() => {
    const restoreViewsFromDB = async () => {
      if (views.length > 0 && openViews.length === 0) {
        try {
          // TODO: Migrate to active_views table
          // Fetch views state from database
          // const response = await fetch(`/api/session/${sessionId}/views-state`);
          // const result = await response.json();
          const result = { success: false }; // Temporary: views-state endpoint removed

          if (result.success && result.viewsState) {
            const { openViewIds, activeViewId: savedActiveViewId } = result.viewsState;

            if (openViewIds && openViewIds.length > 0) {
              // Match saved IDs with loaded views
              const restoredViews = openViewIds
                .map((id: string) => views.find((v) => v.id === id))
                .filter((v): v is IView => v !== undefined);

              if (restoredViews.length > 0) {
                setOpenViews(restoredViews);
                // Restore active view if it's in the restored views
                if (savedActiveViewId && restoredViews.some((v) => v.id === savedActiveViewId)) {
                  setActiveViewId(savedActiveViewId);
                } else {
                  // Default to first restored view
                  setActiveViewId(restoredViews[0].id);
                }
                return;
              }
            }
          }
        } catch (error) {
          console.error('Error restoring views from database:', error);
        }

        // No fallback needed - "All Data" tab is always visible
      }
    };

    restoreViewsFromDB();
  }, [views, sessionId]);

  // Persist open views to database
  useEffect(() => {
    const saveViewsToDB = async () => {
      if (openViews.length > 0) {
        const viewIds = openViews.map((v) => v.id);
        try {
          // TODO: Migrate to active_views table
          /*
          await fetch(`/api/session/${sessionId}/views-state`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              openViewIds: viewIds,
              activeViewId: activeViewId,
            }),
          });
          */
        } catch (error) {
          console.error('Error saving views state to database:', error);
        }
      } else {
        // Clear state when no views are open
        try {
          // TODO: Migrate to active_views table
          /*
          await fetch(`/api/session/${sessionId}/views-state`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              openViewIds: [],
              activeViewId: null,
            }),
          });
          */
        } catch (error) {
          console.error('Error clearing views state in database:', error);
        }
      }
    };

    // Debounce save to avoid too many DB writes
    const timeoutId = setTimeout(() => {
      saveViewsToDB();
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [openViews, activeViewId, sessionId]);

  // Get active view
  const activeView = useMemo(() => {
    return openViews.find((v) => v.id === activeViewId) || null;
  }, [openViews, activeViewId]);

  // Filter data based on active view
  const filteredData = useMemo(() => {
    if (!activeView) return data;

    try {
      // filter_config is already deserialized by the adapter
      const filterConfig = activeView.filter_config;
      return applyFilters(data, filterConfig, '');
    } catch (error) {
      console.error('Error applying filters:', error);
      return data;
    }
  }, [data, activeView]);

  // Handlers
  const handleOpenView = (view: IView) => {
    // Check if already open
    if (openViews.find((v) => v.id === view.id)) {
      // Just switch to it
      setActiveViewId(view.id);
    } else {
      // Add to open views
      setOpenViews([...openViews, view]);
      setActiveViewId(view.id);
    }
  };

  const handleCloseView = (viewId: string) => {
    const newOpenViews = openViews.filter((v) => v.id !== viewId);
    setOpenViews(newOpenViews);

    // If closing active view, switch to another
    if (viewId === activeViewId) {
      if (newOpenViews.length > 0) {
        setActiveViewId(newOpenViews[newOpenViews.length - 1].id);
      } else {
        setActiveViewId(null);
      }
    }
  };

  const handleCreateView = () => {
    setIsCreateViewOpen(true);
    setViewName('');
    setViewDescription('');
    setViewCategory('Custom');
  };

  const handleSaveNewView = async () => {
    if (!viewName.trim()) {
      alert('Please enter a view name');
      return;
    }

    try {
      // Call saveView with correct signature: (name, options)
      const result = await saveView(viewName, {
        workspaceId,
        sessionId,
        description: viewDescription,
        category: viewCategory,
      });

      if (result.success && result.view) {
        // Reload views for the workspace
        await loadViews(workspaceId, sessionId);

        // Auto-open the newly created view as a blue tab
        setOpenViews([...openViews, result.view]);
        setActiveViewId(result.view.id);

        // Reset state and close dialog
        setIsCreateViewOpen(false);
        setViewName('');
        setViewDescription('');
        setViewCategory('Custom');
      } else {
        alert(`Failed to save view: ${result.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error saving view:', error);
      alert('Failed to save view');
    }
  };

  if (isLoadingSession) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-slate-600">Loading session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* TopBar */}
      <TopBar
        workspaceName={workspaceName}
        sessionName={sessionName}
        onNavigateBack={() => router.push(`/app/workspace/${workspaceId}`)}
      />

      {/* Sheet Tabs (for Excel files) */}
      {sheets && sheets.length > 1 && (
        <SheetTabs
          sheets={sheets}
          activeSheet={activeSheet}
          onSheetChange={setDataActiveSheet}
        />
      )}

      {/* Workspace Toolbar */}
      <WorkspaceToolbar
        onCreateView={handleCreateView}
        onAddView={() => setIsViewPickerOpen(true)}
        onExport={() => console.log('Export clicked - TODO: implement')}
        onSave={() => console.log('Save clicked - TODO: implement')}
        onSaveAsNew={() => console.log('Save as new clicked - TODO: implement')}
        onShare={() => console.log('Share clicked - TODO: implement')}
        onSettings={() => console.log('Settings clicked - TODO: implement')}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {activeView ? (
          <ViewSplitLayout
            view={activeView}
            data={filteredData}
            columns={columns}
          />
        ) : (
          <DataTable columns={columns} data={data} />
        )}
      </div>

      {/* View Sheet Tabs */}
      <ViewSheetTabs
        openViews={openViews}
        activeViewId={activeViewId}
        onSelectView={setActiveViewId}
        onCloseView={handleCloseView}
        onAddView={() => setIsViewPickerOpen(true)}
      />

      {/* StatusBar */}
      <StatusBar
        filteredCount={filteredData.length}
        totalCount={data.length}
      />

      {/* View Picker Dialog */}
      <ViewPickerDialog
        isOpen={isViewPickerOpen}
        onClose={() => setIsViewPickerOpen(false)}
        views={views}
        onSelectView={handleOpenView}
        openViewIds={openViews.map((v) => v.id)}
      />

      {/* Create View Dialog - Unified (Nome + Filtri) */}
      <Dialog open={isCreateViewOpen} onOpenChange={setIsCreateViewOpen}>
        <DialogContent className="max-w-5xl max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Crea Nuova View</DialogTitle>
            <DialogDescription>
              Configura nome e filtri per la tua view
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto space-y-6 py-4">
            {/* Nome e Descrizione */}
            <div className="space-y-4 px-1">
              <div>
                <Label htmlFor="view-name">Nome View *</Label>
                <Input
                  id="view-name"
                  value={viewName}
                  onChange={(e) => setViewName(e.target.value)}
                  placeholder="Es: Clienti VIP, Ordini Q1 2024..."
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="view-description">Descrizione (opzionale)</Label>
                <Textarea
                  id="view-description"
                  value={viewDescription}
                  onChange={(e) => setViewDescription(e.target.value)}
                  placeholder="Descrivi questa view..."
                  className="mt-1.5"
                  rows={2}
                />
              </div>
            </div>

            {/* Divider */}
            <div className="border-t" />

            {/* Filter Builder */}
            <div>
              <h4 className="text-sm font-medium text-slate-900 mb-3 px-1">Filtri</h4>
              <FilterBuilder
                columns={columns}
                data={data}
              />
            </div>
          </div>

          <DialogFooter className="border-t pt-4">
            <Button variant="outline" onClick={() => setIsCreateViewOpen(false)}>
              Annulla
            </Button>
            <Button onClick={handleSaveNewView} disabled={!viewName.trim()}>
              Crea View
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
