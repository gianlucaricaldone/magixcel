'use client';

import { useState } from 'react';
import { Search, Settings, ChevronRight, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface TopBarProps {
  fileName: string;
  workspaceName?: string;
  workspaceId?: string;
  sessionName?: string;
  onSearchChange: (value: string) => void;
  searchInputRef?: React.RefObject<HTMLInputElement>;
}

export function TopBar({
  fileName,
  workspaceName,
  workspaceId,
  sessionName,
  onSearchChange,
  searchInputRef,
}: TopBarProps) {
  const [searchValue, setSearchValue] = useState('');

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

      {/* Center: Search Bar */}
      <div className="flex-1 max-w-2xl mx-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            ref={searchInputRef}
            type="text"
            value={searchValue}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Search in all columns..."
            className="w-full pl-10 pr-10 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          />
          {searchValue && (
            <button
              onClick={() => handleSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Right: Settings Only */}
      <div className="flex items-center">
        <Button variant="outline" size="sm" className="h-9 px-3">
          <Settings className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
