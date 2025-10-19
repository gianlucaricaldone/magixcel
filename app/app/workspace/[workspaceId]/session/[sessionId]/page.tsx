'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSessionStore } from '@/stores/session-store';
import { useDataStore } from '@/stores/data-store';
import { useFilterStore } from '@/stores/filter-store';
import { DataTable } from '@/components/table/DataTable';
import { FilterBuilder } from '@/components/filters/FilterBuilder';
import { TopBar } from '@/components/dashboard/TopBar';
import { CollapsibleSidebar } from '@/components/dashboard/CollapsibleSidebar';
import { FilterPanel } from '@/components/dashboard/FilterPanel';
import { PresetManager } from '@/components/dashboard/PresetManager';
import { StatusBar } from '@/components/dashboard/StatusBar';
import { KeyboardShortcutsHelp } from '@/components/dashboard/KeyboardShortcutsHelp';
import { TableStatsBar } from '@/components/dashboard/TableStatsBar';
import { SheetTabs } from '@/components/dashboard/SheetTabs';
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

export default function SessionPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.sessionId as string;
  const workspaceId = params.workspaceId as string;

  const { setSession, metadata, setLoading, setError } = useSessionStore();
  const { data, setData, filteredData, setFilteredData, setSheets, sheets, activeSheet, setActiveSheet: setDataActiveSheet, updateSheetFilteredCount } = useDataStore();
  const { getFilterConfig, filtersBySheet, setActiveSheet: setFilterActiveSheet, restoreFiltersBySheet } = useFilterStore();

  const [isLoadingSession, setIsLoadingSession] = useState(true);
  const [globalSearch, setGlobalSearch] = useState('');
  const debouncedGlobalSearch = useDebounce(globalSearch, 300);
  const [workspaceName, setWorkspaceName] = useState<string>('');
  const [sessionName, setSessionName] = useState<string>('');

  // Modals state
  const [showFilterBuilder, setShowFilterBuilder] = useState(false);
  const [showSavePreset, setShowSavePreset] = useState(false);
  const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false);
  const [presetName, setPresetName] = useState('');
  const [presetDescription, setPresetDescription] = useState('');
  const [presetCategory, setPresetCategory] = useState('Custom');

  // Refs
  const searchInputRef = useRef<HTMLInputElement>(null);

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
      description: 'Save preset',
    },
    {
      key: 'Escape',
      handler: (e) => {
        e.preventDefault();
        if (showFilterBuilder) {
          setShowFilterBuilder(false);
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
    // TODO: Implement save preset
    console.log('Save preset:', { presetName, presetDescription, presetCategory });
    setShowSavePreset(false);
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

      {/* Main Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar - Collapsible */}
        <CollapsibleSidebar
          filterPanel={
            <FilterPanel
              onOpenFilterBuilder={() => setShowFilterBuilder(true)}
            />
          }
          presetsPanel={
            <PresetManager onSavePreset={() => setShowSavePreset(true)} />
          }
        />

        {/* Main Content - Data Table */}
        <div className="flex-1 flex flex-col min-h-0">
          {/* Table Container - Can scroll */}
          <div className="flex-1 min-h-0 overflow-hidden">
            <div className="h-full bg-white overflow-hidden flex flex-col">
              {/* Stats Bar */}
              <TableStatsBar
                totalRows={data.length}
                totalColumns={columnCount}
                filteredRows={filteredData.length}
              />
              {/* Table */}
              <div className="flex-1 overflow-hidden">
                <DataTable columns={columns} />
              </div>
            </div>
          </div>

          {/* Sheet Tabs - Excel only - Always visible at bottom */}
          <SheetTabs />

          {/* StatusBar - Fixed at bottom */}
          <StatusBar
            filteredCount={filteredData.length}
            totalCount={data.length}
          />
        </div>
      </div>

      {/* Filter Builder Modal */}
      <Dialog open={showFilterBuilder} onOpenChange={setShowFilterBuilder}>
        <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Build Advanced Filters</DialogTitle>
            <DialogDescription>
              Create complex filter conditions with groups and combinators
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto py-4">
            <FilterBuilder columns={columns} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowFilterBuilder(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Save Preset Modal */}
      <Dialog open={showSavePreset} onOpenChange={setShowSavePreset}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Save Filter Preset</DialogTitle>
            <DialogDescription>
              Save current filters as a reusable preset
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
            <Button onClick={handleSavePreset}>Save Preset</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Keyboard Shortcuts Help */}
      {showKeyboardShortcuts && (
        <KeyboardShortcutsHelp onClose={() => setShowKeyboardShortcuts(false)} />
      )}
    </div>
  );
}
