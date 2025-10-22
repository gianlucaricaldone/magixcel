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
  const [isFilterBuilderOpen, setIsFilterBuilderOpen] = useState(false);
  const [showSaveViewDialog, setShowSaveViewDialog] = useState(false);
  const [viewName, setViewName] = useState('');
  const [viewDescription, setViewDescription] = useState('');
  const [viewCategory, setViewCategory] = useState('Custom');
  const [capturedFilterConfig, setCapturedFilterConfig] = useState<any>(null);

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
        if (workspaceResult.success) {
          setWorkspaceName(workspaceResult.workspace.name);
        }

        // Load session
        const sessionResponse = await fetch(`/api/session/${sessionId}`);
        const sessionResult = await sessionResponse.json();

        if (sessionResult.success) {
          setSession(sessionResult.session);
          setSessionName(sessionResult.session.name);

          // Load data.json
          const dataResponse = await fetch(`/api/session/${sessionId}/data`);
          const dataResult = await dataResponse.json();

          if (dataResult.success) {
            setData(dataResult.data);

            // Handle sheets (Excel files)
            if (sessionResult.session.file_type === 'xlsx' || sessionResult.session.file_type === 'xls') {
              try {
                const sheetsResponse = await fetch(`/api/session/${sessionId}/sheets`);
                const sheetsResult = await sheetsResponse.json();

                if (sheetsResult.success && sheetsResult.sheets && sheetsResult.sheets.length > 0) {
                  setSheets(sheetsResult.sheets);
                  const firstSheet = sheetsResult.sheets[0].name;
                  setDataActiveSheet(firstSheet);
                }
              } catch (error) {
                console.warn('No sheets.json found, treating as single sheet');
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

  // Auto-open "All Data" view on load
  useEffect(() => {
    if (views.length > 0 && openViews.length === 0) {
      const allDataView = views.find((v) => v.is_default === 1);
      if (allDataView) {
        setOpenViews([allDataView]);
        setActiveViewId(allDataView.id);
      }
    }
  }, [views]);

  // Get active view
  const activeView = useMemo(() => {
    return openViews.find((v) => v.id === activeViewId) || null;
  }, [openViews, activeViewId]);

  // Filter data based on active view
  const filteredData = useMemo(() => {
    if (!activeView) return data;

    try {
      const filterConfig = JSON.parse(activeView.filter_config);
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
    setIsFilterBuilderOpen(true);
  };

  const handleSaveNewView = async () => {
    if (!viewName.trim()) {
      alert('Please enter a view name');
      return;
    }

    if (!capturedFilterConfig) {
      alert('No filter configuration captured');
      return;
    }

    try {
      await saveView({
        workspaceId,
        sessionId,
        sheetName: activeSheet,
        name: viewName,
        description: viewDescription,
        category: viewCategory,
        filterConfig: capturedFilterConfig,
      });

      // Reload views for the current sheet
      loadViews(workspaceId, sessionId, activeSheet);

      // Reset state
      setShowSaveViewDialog(false);
      setViewName('');
      setViewDescription('');
      setViewCategory('Custom');
      setCapturedFilterConfig(null);
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
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <p className="text-slate-600 mb-4">No view selected</p>
              <Button onClick={() => setIsViewPickerOpen(true)}>
                Select a View
              </Button>
            </div>
          </div>
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

      {/* Filter Builder Dialog (for Create View) */}
      <Dialog open={isFilterBuilderOpen} onOpenChange={setIsFilterBuilderOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Crea Nuova View</DialogTitle>
            <DialogDescription>
              Configura i filtri per la tua view
            </DialogDescription>
          </DialogHeader>
          <div className="overflow-y-auto">
            <FilterBuilder
              columns={columns}
              data={data}
              onApply={() => {
                // Capture the current filter configuration from the store
                const filterConfig = getFilterConfig();
                setCapturedFilterConfig(filterConfig);
                setIsFilterBuilderOpen(false);
                setShowSaveViewDialog(true);
              }}
              onCancel={() => {
                setIsFilterBuilderOpen(false);
              }}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Save View Dialog */}
      <Dialog open={showSaveViewDialog} onOpenChange={setShowSaveViewDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Salva View</DialogTitle>
            <DialogDescription>
              Dai un nome alla tua view
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="view-name">Nome *</Label>
              <Input
                id="view-name"
                value={viewName}
                onChange={(e) => setViewName(e.target.value)}
                placeholder="Es: Clienti VIP"
              />
            </div>
            <div>
              <Label htmlFor="view-description">Descrizione</Label>
              <Textarea
                id="view-description"
                value={viewDescription}
                onChange={(e) => setViewDescription(e.target.value)}
                placeholder="Descrivi questa view..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSaveViewDialog(false)}>
              Annulla
            </Button>
            <Button onClick={handleSaveNewView}>Salva View</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
