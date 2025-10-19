'use client';

import { useState } from 'react';
import { Search, Download, Share2, Settings, ChevronRight, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface TopBarProps {
  fileName: string;
  workspaceName?: string;
  workspaceId?: string;
  sessionName?: string;
  onSearchChange: (value: string) => void;
  onSave?: () => void;
  onExport?: (format: 'csv' | 'excel' | 'json') => void;
  searchInputRef?: React.RefObject<HTMLInputElement>;
}

export function TopBar({
  fileName,
  workspaceName,
  workspaceId,
  sessionName,
  onSearchChange,
  onSave,
  onExport,
  searchInputRef,
}: TopBarProps) {
  const [searchValue, setSearchValue] = useState('');
  const [showExportMenu, setShowExportMenu] = useState(false);

  const handleSearchChange = (value: string) => {
    setSearchValue(value);
    onSearchChange(value);
  };

  return (
    <div className="h-14 bg-white border-b border-slate-200 px-4 flex items-center justify-between sticky top-0 z-40 shadow-sm">
      {/* Left: Breadcrumb */}
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <Link href="/app" className="text-blue-600 hover:text-blue-700 font-medium text-sm">
          MagiXcel
        </Link>
        {workspaceName && workspaceId && (
          <>
            <ChevronRight className="h-4 w-4 text-slate-400" />
            <Link
              href={`/app/workspace/${workspaceId}`}
              className="text-slate-600 hover:text-slate-700 text-sm truncate max-w-[150px]"
              title={workspaceName}
            >
              {workspaceName}
            </Link>
          </>
        )}
        <ChevronRight className="h-4 w-4 text-slate-400" />
        <span className="text-slate-900 font-medium text-sm truncate max-w-xs" title={sessionName || fileName}>
          {sessionName || fileName}
        </span>
      </div>

      {/* Center: Search Bar + Live Toggle */}
      <div className="flex-1 max-w-2xl mx-3 flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            ref={searchInputRef}
            type="text"
            value={searchValue}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Search in all columns..."
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          />
        </div>

        {/* Save Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={onSave}
          className="h-9"
        >
          <Save className="h-4 w-4 mr-2" />
          Salva
        </Button>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2">

        {/* Actions */}
        <div className="flex items-center gap-1.5">
          {/* Export Dropdown */}
          <div className="relative">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="h-9"
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>

            {showExportMenu && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowExportMenu(false)}
                />
                <div className="absolute right-0 mt-2 w-40 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-50">
                  <button
                    onClick={() => {
                      onExport?.('csv');
                      setShowExportMenu(false);
                    }}
                    className="w-full px-4 py-2 text-sm text-left hover:bg-slate-100 transition-colors"
                  >
                    Export as CSV
                  </button>
                  <button
                    onClick={() => {
                      onExport?.('excel');
                      setShowExportMenu(false);
                    }}
                    className="w-full px-4 py-2 text-sm text-left hover:bg-slate-100 transition-colors"
                  >
                    Export as Excel
                  </button>
                  <button
                    onClick={() => {
                      onExport?.('json');
                      setShowExportMenu(false);
                    }}
                    className="w-full px-4 py-2 text-sm text-left hover:bg-slate-100 transition-colors"
                  >
                    Export as JSON
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Share */}
          <Button variant="outline" size="sm" className="h-9">
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </Button>

          {/* Settings */}
          <Button variant="outline" size="sm" className="h-9 px-3">
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
