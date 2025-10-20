'use client';

import { useEffect, useState, useRef, useMemo } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useSessionStore } from '@/stores/session-store';
import { useDataStore } from '@/stores/data-store';
import { useFilterStore } from '@/stores/filter-store';
import { TopBar } from '@/components/dashboard/TopBar';
import { TabNavigation, TabType } from '@/components/dashboard/TabNavigation';
import { StatusBar } from '@/components/dashboard/StatusBar';
import { KeyboardShortcutsHelp } from '@/components/dashboard/KeyboardShortcutsHelp';
import { SheetTabs } from '@/components/dashboard/SheetTabs';
import { ExplorerTab } from '@/components/tabs/ExplorerTab';
import { ViewsTab } from '@/components/tabs/ViewsTab';
import { AITab } from '@/components/tabs/AITab';
import { FilterBuilder } from '@/components/filters/FilterBuilder';
import { CommandPalette, useCommandPalette } from '@/components/command/CommandPalette';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { applyFilters } from '@/lib/processing/filter-engine';
import { useDebounce } from '@/lib/hooks/useDebounce';
import { useKeyboardShortcuts } from '@/lib/hooks/useKeyboardShortcuts';
import { exportToCSV, exportToExcel, exportToExcelMultiSheet, exportToJSON, getExportFilename } from '@/lib/export/exportData';
import { IFileMetadata } from '@/types';
import { IView } from '@/types/database';

export default function SessionPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = params.sessionId as string;
  const workspaceId = params.workspaceId as string;

  const { setSession, metadata, setLoading, setError } = useSessionStore();
  const { data, setData, filteredData, setFilteredData, setSheets, sheets, activeSheet, setActiveSheet: setDataActiveSheet, updateSheetFilteredCount } = useDataStore();
  const { getFilterConfig, filtersBySheet, setActiveSheet: setFilterActiveSheet, restoreFiltersBySheet, saveView, loadViews } = useFilterStore();

  const [isLoadingSession, setIsLoadingSession] = useState(true);
  const [globalSearch, setGlobalSearch] = useState('');
  const debouncedGlobalSearch = useDebounce(globalSearch, 300);
  const [workspaceName, setWorkspaceName] = useState<string>('');
  const [sessionName, setSessionName] = useState<string>('');

  // Tab navigation state - Read from URL or default to 'explorer'
  const initialTab = (searchParams.get('tab') as TabType) || 'explorer';
  const [activeTab, setActiveTab] = useState<TabType>(initialTab);
  const [currentView, setCurrentView] = useState<IView | null>(null);
  const [chartCounts, setChartCounts] = useState<Record<string, number>>({});

  // Handle tab change with URL update
  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    // Update URL without reload
    const currentPath = window.location.pathname;
    const newUrl = `${currentPath}?tab=${tab}`;
    window.history.pushState({}, '', newUrl);
  };

  // Modals state
  const [showFilterBuilder, setShowFilterBuilder] = useState(false);
  const [showSavePreset, setShowSavePreset] = useState(false);
  const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false);
  const [presetName, setPresetName] = useState('');
  const [presetDescription, setPresetDescription] = useState('');
  const [presetCategory, setPresetCategory] = useState('Custom');

  // Command Palette (⌘K)
  const commandPalette = useCommandPalette();

  // Refs
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Load all views on mount and when sheet changes
  const { views } = useFilterStore();

  // Reload views when active sheet changes
  useEffect(() => {
    if (workspaceId && sessionId) {
      loadViews(workspaceId, sessionId, activeSheet);
    }
  }, [workspaceId, sessionId, activeSheet, loadViews]);

  // Load chart counts for all views
  useEffect(() => {
    const loadAllChartCounts = async () => {
      const counts: Record<string, number> = {};
      for (const view of views) {
        try {
          const response = await fetch(`/api/views/${view.id}/charts`);
          const result = await response.json();
          if (result.success) {
            counts[view.id] = result.charts?.length || 0;
          }
        } catch (error) {
          console.error(`Error loading chart count for view ${view.id}:`, error);
        }
      }
      setChartCounts(counts);
    };

    if (views.length > 0) {
      loadAllChartCounts();
    }
  }, [views]);

  // Handlers for Views tab
  const handleSelectView = (view: IView) => {
    setCurrentView(view);
    // Load the view's filters
    useFilterStore.getState().loadView(view.id);
  };

  const handleCreateView = () => {
    // Switch to Explorer tab to create view with filters
    setActiveTab('explorer');
    setShowSavePreset(true);
  };

  const handleUpdateView = async (viewId: string, updates: Partial<IView>) => {
    try {
      const response = await fetch(`/api/views/${viewId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      const result = await response.json();
      if (result.success) {
        // Reload views for current sheet
        await loadViews(workspaceId, sessionId, activeSheet);
        // Update current view if it's the one being edited
        if (currentView?.id === viewId) {
          setCurrentView(result.view);
        }
      }
    } catch (error) {
      console.error('Error updating view:', error);
    }
  };

  const handleDeleteView = async (viewId: string) => {
    try {
      const response = await fetch(`/api/views/${viewId}`, {
        method: 'DELETE',
      });

      const result = await response.json();
      if (result.success) {
        // Clear current view if it was deleted
        if (currentView?.id === viewId) {
          setCurrentView(null);
        }
        // Reload views for current sheet
        await loadViews(workspaceId, sessionId, activeSheet);
      } else {
        alert(result.error || 'Failed to delete view');
      }
    } catch (error) {
      console.error('Error deleting view:', error);
      alert('Failed to delete view');
    }
  };

  const handleEditFilters = () => {
    if (!currentView) return;

    // Load the current view's filters into the filter store
    useFilterStore.getState().loadView(currentView.id);

    // Open the filter builder modal
    setShowFilterBuilder(true);
  };

  const handleCloseFilterBuilder = async () => {
    setShowFilterBuilder(false);

    // If we have a current view, save the updated filters
    if (currentView) {
      const filterConfig = getFilterConfig();

      try {
        const response = await fetch(`/api/views/${currentView.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            filter_config: JSON.stringify(filterConfig),
          }),
        });

        const result = await response.json();
        if (result.success) {
          // Reload views to get updated data for current sheet
          await loadViews(workspaceId, sessionId, activeSheet);
          // Update current view
          setCurrentView(result.view);
        }
      } catch (error) {
        console.error('Error updating view filters:', error);
      }
    }
  };

  // Keyboard shortcuts
  useKeyboardShortcuts([
    {
      key: 'f',
      ctrlOrCmd: true,
      handler: (e) => {
        e.preventDefault();
        searchInputRef.current?.focus();
      },
      description: 'Focus search',
    },
    {
      key: 'k',
      ctrlOrCmd: true,
      handler: (e) => {
        e.preventDefault();
        setShowFilterBuilder(true);
      },
      description: 'Open filter builder',
    },
    {
      key: 's',
      ctrlOrCmd: true,
      handler: (e) => {
        e.preventDefault();
        setShowSavePreset(true);
      },
      description: 'Save view',
    },
    {
      key: 'Escape',
      handler: (e) => {
        e.preventDefault();
        if (showFilterBuilder) {
          handleCloseFilterBuilder();
        } else if (showSavePreset) {
          setShowSavePreset(false);
        } else if (showKeyboardShortcuts) {
          setShowKeyboardShortcuts(false);
        } else if (globalSearch) {
          setGlobalSearch('');
        }
      },
      description: 'Close modals or clear search',
    },
    {
      key: '?',
      handler: (e) => {
        e.preventDefault();
        setShowKeyboardShortcuts(!showKeyboardShortcuts);
      },
      description: 'Toggle keyboard shortcuts help',
    },
  ]);

  useEffect(() => {
    if (sessionId) {
      loadSession(sessionId);
    }
  }, [sessionId]);

  // Sync active sheet between data store and filter store
  useEffect(() => {
    if (activeSheet) {
      setFilterActiveSheet(activeSheet);
    }
  }, [activeSheet, setFilterActiveSheet]);

  // Apply filters and global search (always LIVE)
  useEffect(() => {
    if (data.length === 0) return;

    const filterConfig = getFilterConfig();
    const filtered = applyFilters(data, filterConfig, debouncedGlobalSearch);
    setFilteredData(filtered);

    // Update filtered count for active sheet
    if (activeSheet) {
      updateSheetFilteredCount(activeSheet, filtered.length);
    }
  }, [debouncedGlobalSearch, data, filtersBySheet, activeSheet, getFilterConfig, setFilteredData, updateSheetFilteredCount]);

  const loadSession = async (id: string) => {
    setIsLoadingSession(true);
    setLoading(true);

    try {
      // Load workspace info
      const workspaceResponse = await fetch(`/api/workspace/${workspaceId}`);
      const workspaceResult = await workspaceResponse.json();

      if (workspaceResult.success && workspaceResult.workspace) {
        setWorkspaceName(workspaceResult.workspace.name);
      }

      // Load session metadata
      const metadataResponse = await fetch(`/api/session/${id}`);
      const metadataResult = await metadataResponse.json();

      if (!metadataResult.success || !metadataResult.session) {
        setError('Session not found');
        router.push('/app');
        return;
      }

      // Set session name
      setSessionName(metadataResult.session.name);

      // Load session data
      const dataResponse = await fetch(`/api/session/${id}/data`);
      const dataResult = await dataResponse.json();

      if (!dataResult.success || !dataResult.data) {
        setError('Failed to load session data');
        return;
      }

      // Create metadata from session
      const session = metadataResult.session;
      const sessionMetadata: IFileMetadata = {
        fileName: session.original_file_name,
        fileSize: session.file_size,
        fileType: session.file_type,
        rowCount: session.row_count,
        columnCount: session.column_count,
        columns: Object.keys(dataResult.data[0] || {}),
        preview: dataResult.data.slice(0, 10),
      };

      setSession(id, sessionMetadata);

      // Load sheets if available (Excel files)
      if (dataResult.sheets && dataResult.sheets.length > 0) {
        setSheets(dataResult.sheets);
        // Set active sheet in filter store
        if (dataResult.sheets[0]) {
          setFilterActiveSheet(dataResult.sheets[0].sheetName);
        }
      } else {
        setData(dataResult.data);
        // No sheets, set null for CSV files
        setFilterActiveSheet(null);
      }

      // Restore saved filters if available
      if (session.active_filters) {
        try {
          const savedFilters = JSON.parse(session.active_filters);
          // Restore filters to filter store
          restoreFiltersBySheet(savedFilters);
        } catch (error) {
          console.error('Error parsing saved filters:', error);
        }
      }
    } catch (error: any) {
      console.error('Failed to load session:', error);
      setError(error.message || 'Failed to load session');
      router.push('/app');
    } finally {
      setIsLoadingSession(false);
      setLoading(false);
    }
  };

  const handleExport = (format: 'csv' | 'excel' | 'json') => {
    // Generate filename with timestamp and filter info
    const hasFilters = sheets.length > 0 && sheets.some(sheet =>
      sheet.filteredRowCount !== undefined && sheet.filteredRowCount !== sheet.rowCount
    );
    const suffix = hasFilters ? 'filtered' : 'all';
    const filename = getExportFilename(metadata?.fileName || 'export', suffix);

    // Export based on format
    switch (format) {
      case 'csv':
        // CSV exports only active sheet data
        if (!filteredData || filteredData.length === 0) {
          alert('Nessun dato da esportare');
          return;
        }
        exportToCSV(filteredData, filename);
        break;
      case 'excel':
        // Excel exports all sheets with their filters
        if (sheets.length > 1) {
          const { filtersBySheet } = useFilterStore.getState();
          exportToExcelMultiSheet(sheets, filtersBySheet, filename);
        } else {
          if (!filteredData || filteredData.length === 0) {
            alert('Nessun dato da esportare');
            return;
          }
          exportToExcel(filteredData, filename);
        }
        break;
      case 'json':
        // JSON exports only active sheet data
        if (!filteredData || filteredData.length === 0) {
          alert('Nessun dato da esportare');
          return;
        }
        exportToJSON(filteredData, filename);
        break;
    }
  };

  const handleSavePreset = async () => {
    if (!presetName.trim()) {
      alert('Please enter a name for the view');
      return;
    }

    const result = await saveView(presetName, {
      description: presetDescription,
      category: presetCategory,
      workspaceId: workspaceId,
      sessionId: sessionId,
    });

    if (result.success && result.view) {
      // Reset form and close dialog
      setPresetName('');
      setPresetDescription('');
      setPresetCategory('Custom');
      setShowSavePreset(false);

      // Reload views to update the list for current sheet
      await loadViews(workspaceId, sessionId, activeSheet);

      // Set as current view
      setCurrentView(result.view);

      // Switch to Views tab to show the newly created view
      setActiveTab('views');
    } else {
      alert(result.error || 'Failed to save view');
    }
  };

  const handleSaveSession = async () => {
    try {
      // Get current filters state from filter store
      const { filtersBySheet } = useFilterStore.getState();

      const response = await fetch(`/api/session/${sessionId}/filters`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ filtersBySheet }),
      });

      const result = await response.json();

      if (result.success) {
        alert('Sessione salvata con successo!');
      } else {
        alert('Errore nel salvataggio: ' + result.error.message);
      }
    } catch (error) {
      console.error('Error saving session:', error);
      alert('Errore nel salvataggio della sessione');
    }
  };

  if (isLoadingSession || !metadata) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent mb-4" />
          <p className="text-lg text-slate-600">Loading session...</p>
        </div>
      </div>
    );
  }

  // Get columns from active sheet or metadata
  const activeSheetData = sheets.find(s => s.sheetName === activeSheet);
  const columns = activeSheetData ? activeSheetData.columns : metadata.columns;
  const columnCount = activeSheetData ? activeSheetData.columnCount : metadata.columnCount;

  return (
    <div className="h-screen flex flex-col bg-slate-50">
      {/* TopBar - Fixed */}
      <TopBar
        fileName={metadata.fileName}
        workspaceName={workspaceName}
        workspaceId={workspaceId}
        sessionName={sessionName}
        onSearchChange={setGlobalSearch}
        onSave={handleSaveSession}
        onExport={handleExport}
        searchInputRef={searchInputRef}
      />

      {/* Tab Navigation */}
      <TabNavigation
        activeTab={activeTab}
        onTabChange={handleTabChange}
        viewCount={views.length}
      />

      {/* Main Layout - Conditional based on active tab */}
      <div className="flex-1 flex overflow-hidden">
        {activeTab === 'explorer' && (
          <ExplorerTab
            data={data}
            filteredData={filteredData}
            columns={columns}
            columnCount={columnCount}
            onOpenFilterBuilder={() => setShowFilterBuilder(true)}
            onSaveAsView={() => setShowSavePreset(true)}
          />
        )}

        {activeTab === 'views' && (
          <ViewsTab
            views={views}
            currentView={currentView}
            data={filteredData}
            columns={columns}
            columnCount={columnCount}
            onSelectView={handleSelectView}
            onCreateView={handleCreateView}
            onUpdateView={handleUpdateView}
            onDeleteView={handleDeleteView}
            onEditFilters={handleEditFilters}
            chartCounts={chartCounts}
          />
        )}

        {activeTab === 'ai' && <AITab />}
      </div>

      {/* Sheet Tabs - Excel only - Always visible at bottom */}
      {sheets.length > 0 && <SheetTabs />}

      {/* StatusBar - Fixed at bottom */}
      {activeTab === 'explorer' && (
        <StatusBar
          filteredCount={filteredData.length}
          totalCount={data.length}
        />
      )}

      {/* Filter Builder Modal */}
      <Dialog
        open={showFilterBuilder}
        onOpenChange={(open) => {
          if (!open) {
            handleCloseFilterBuilder();
          }
        }}
      >
        <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>
              {currentView ? `Edit Filters - ${currentView.name}` : 'Build Advanced Filters'}
            </DialogTitle>
            <DialogDescription>
              {currentView
                ? 'Modify the filter conditions for this view'
                : 'Create complex filter conditions with groups and combinators'}
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto py-4">
            <FilterBuilder columns={columns} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseFilterBuilder}>
              {currentView ? 'Save & Close' : 'Close'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Save View Modal */}
      <Dialog open={showSavePreset} onOpenChange={setShowSavePreset}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Save Filter View</DialogTitle>
            <DialogDescription>
              Save current filters as a reusable view
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Name *</label>
              <input
                type="text"
                value={presetName}
                onChange={(e) => setPresetName(e.target.value)}
                placeholder="e.g., Active Customers"
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <input
                type="text"
                value={presetDescription}
                onChange={(e) => setPresetDescription(e.target.value)}
                placeholder="Optional description"
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Category</label>
              <input
                type="text"
                value={presetCategory}
                onChange={(e) => setPresetCategory(e.target.value)}
                placeholder="e.g., Sales, Finance"
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSavePreset(false)}>
              Cancel
            </Button>
            <Button onClick={handleSavePreset}>Save View</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Keyboard Shortcuts Help */}
      {showKeyboardShortcuts && (
        <KeyboardShortcutsHelp onClose={() => setShowKeyboardShortcuts(false)} />
      )}

      {/* Command Palette (⌘K) */}
      <CommandPalette isOpen={commandPalette.isOpen} onClose={commandPalette.close} />
    </div>
  );
}
