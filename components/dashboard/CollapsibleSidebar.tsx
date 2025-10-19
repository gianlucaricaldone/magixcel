'use client';

import { ReactNode, useRef, useState, useEffect } from 'react';
import { Filter, FolderOpen, ChevronLeft, ChevronRight } from 'lucide-react';
import { useUIStore } from '@/stores/ui-store';
import { cn } from '@/lib/utils';

interface CollapsibleSidebarProps {
  filterPanel: ReactNode;
  presetsPanel: ReactNode;
}

export function CollapsibleSidebar({
  filterPanel,
  presetsPanel,
}: CollapsibleSidebarProps) {
  const { sidebarCollapsed, sidebarActiveTab, sidebarWidth, toggleSidebar, setSidebarTab, setSidebarWidth } = useUIStore();
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);

  const tabs = [
    { id: 'filters' as const, label: 'Filters', icon: Filter },
    { id: 'presets' as const, label: 'Presets', icon: FolderOpen },
  ];

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isResizing) return;

    const newWidth = e.clientX;
    // Min width: 200px, Max width: 600px
    if (newWidth >= 200 && newWidth <= 600) {
      setSidebarWidth(newWidth);
    }
  };

  const handleMouseUp = () => {
    setIsResizing(false);
  };

  // Add/remove event listeners for resize
  useEffect(() => {
    if (isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  return (
    <div
      ref={sidebarRef}
      className={cn(
        'h-full bg-white border-r border-slate-200 transition-all duration-200 ease-in-out flex flex-col relative',
        sidebarCollapsed ? 'w-12' : ''
      )}
      style={!sidebarCollapsed ? { width: `${sidebarWidth}px` } : undefined}
    >
      {/* Tab Headers */}
      <div className="flex flex-col border-b border-slate-200">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = sidebarActiveTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setSidebarTab(tab.id)}
              className={cn(
                'flex items-center gap-2 px-3 h-11 transition-colors relative',
                isActive
                  ? 'text-blue-600 bg-blue-50'
                  : 'text-slate-600 hover:bg-slate-50',
                sidebarCollapsed && 'justify-center px-0'
              )}
            >
              <Icon className="h-5 w-5 flex-shrink-0" />
              {!sidebarCollapsed && (
                <span className="text-sm font-medium">{tab.label}</span>
              )}
              {isActive && (
                <div className="absolute right-0 top-0 bottom-0 w-1 bg-blue-600" />
              )}
            </button>
          );
        })}
      </div>

      {/* Panel Content */}
      <div className="flex-1 overflow-hidden">
        {!sidebarCollapsed && (
          <>
            {sidebarActiveTab === 'filters' && (
              <div className="h-full overflow-y-auto p-3">{filterPanel}</div>
            )}
            {sidebarActiveTab === 'presets' && (
              <div className="h-full overflow-y-auto p-3">{presetsPanel}</div>
            )}
          </>
        )}
      </div>

      {/* Collapse Toggle Button */}
      <div className="border-t border-slate-200 p-2">
        <button
          onClick={toggleSidebar}
          className="w-full flex items-center justify-center h-10 rounded-md hover:bg-slate-100 transition-colors text-slate-600"
          title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {sidebarCollapsed ? (
            <ChevronRight className="h-5 w-5" />
          ) : (
            <>
              <ChevronLeft className="h-5 w-5 mr-2" />
              <span className="text-sm font-medium">Collapse</span>
            </>
          )}
        </button>
      </div>

      {/* Resize Handle */}
      {!sidebarCollapsed && (
        <div
          onMouseDown={handleMouseDown}
          className={cn(
            'absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-blue-500 transition-colors z-50',
            isResizing && 'bg-blue-500'
          )}
          title="Drag to resize"
        />
      )}
    </div>
  );
}
