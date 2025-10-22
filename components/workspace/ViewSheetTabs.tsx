'use client';

import { IView } from '@/types/database';
import { X, Plus } from 'lucide-react';

interface ViewSheetTabsProps {
  openViews: IView[];
  activeViewId: string | null;
  onSelectView: (viewId: string) => void;
  onCloseView: (viewId: string) => void;
  onAddView: () => void;
}

export function ViewSheetTabs({
  openViews,
  activeViewId,
  onSelectView,
  onCloseView,
  onAddView,
}: ViewSheetTabsProps) {
  return (
    <div className="h-10 bg-slate-50 border-t flex items-center px-2 gap-1 overflow-x-auto">
      {openViews.map((view) => {
        const isActive = view.id === activeViewId;

        return (
          <div
            key={view.id}
            className={`
              group relative flex items-center gap-2 px-4 py-1.5 rounded-t-lg cursor-pointer
              transition-colors min-w-[120px] max-w-[200px]
              ${
                isActive
                  ? 'bg-white border-t-2 border-blue-500 text-slate-900 font-medium'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
              }
            `}
            onClick={() => onSelectView(view.id)}
          >
            <span className="flex-1 truncate text-sm">
              {view.name}
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onCloseView(view.id);
              }}
              className={`
                flex-shrink-0 p-0.5 rounded hover:bg-slate-300 opacity-0 group-hover:opacity-100 transition-opacity
                ${isActive ? 'opacity-100' : ''}
              `}
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        );
      })}

      {/* Add View Button */}
      <button
        onClick={onAddView}
        className="flex items-center justify-center w-8 h-8 rounded hover:bg-slate-200 text-slate-500 hover:text-slate-700 transition-colors"
      >
        <Plus className="h-4 w-4" />
      </button>
    </div>
  );
}
