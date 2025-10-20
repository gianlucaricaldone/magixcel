'use client';

import { IView } from '@/types/database';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Layers, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface ViewsSidebarProps {
  views: IView[];
  currentViewId?: string;
  onSelectView: (view: IView) => void;
  onCreateView: () => void;
  chartCounts?: Record<string, number>;
}

export function ViewsSidebar({
  views,
  currentViewId,
  onSelectView,
  onCreateView,
  chartCounts = {},
}: ViewsSidebarProps) {
  return (
    <div className="w-80 border-r bg-slate-50 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b bg-white">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-slate-900 flex items-center gap-2">
            <Layers className="h-4 w-4" />
            Views
          </h3>
          <Badge variant="secondary" className="text-xs">
            {views.length}
          </Badge>
        </div>
        <Button
          onClick={onCreateView}
          size="sm"
          className="w-full"
          variant="outline"
        >
          <Plus className="h-4 w-4 mr-2" />
          New View
        </Button>
      </div>

      {/* Views List */}
      <div className="flex-1 overflow-y-auto p-3">
        {views.length === 0 ? (
          <div className="text-center py-12 px-4">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-slate-200 mb-3">
              <Layers className="h-6 w-6 text-slate-400" />
            </div>
            <p className="text-sm font-medium text-slate-700 mb-1">
              No views yet
            </p>
            <p className="text-xs text-slate-500">
              Create your first dashboard view
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {views.map((view) => {
              const isActive = view.id === currentViewId;
              const chartCount = chartCounts[view.id] || 0;

              return (
                <button
                  key={view.id}
                  onClick={() => onSelectView(view)}
                  className={`
                    w-full text-left p-3 rounded-lg border transition-all
                    ${
                      isActive
                        ? 'bg-blue-50 border-blue-300 shadow-sm'
                        : 'bg-white border-slate-200 hover:border-blue-200 hover:shadow-sm'
                    }
                  `}
                >
                  {/* View Name */}
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h4
                      className={`font-medium text-sm truncate ${
                        isActive ? 'text-blue-900' : 'text-slate-900'
                      }`}
                    >
                      {view.name}
                    </h4>
                    {isActive && (
                      <div className="flex-shrink-0">
                        <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
                      </div>
                    )}
                  </div>

                  {/* Description */}
                  {view.description && (
                    <p className="text-xs text-slate-600 mb-2 line-clamp-2">
                      {view.description}
                    </p>
                  )}

                  {/* Meta Info */}
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    {chartCount > 0 && (
                      <Badge
                        variant="outline"
                        className="text-[10px] h-5 px-1.5 border-slate-300"
                      >
                        {chartCount} {chartCount === 1 ? 'chart' : 'charts'}
                      </Badge>
                    )}
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>
                        {formatDistanceToNow(new Date(view.updated_at), {
                          addSuffix: true,
                        })}
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer Info */}
      {views.length > 0 && (
        <div className="p-3 border-t bg-white">
          <p className="text-xs text-slate-600">
            💡 Click a view to load it. All changes are auto-saved.
          </p>
        </div>
      )}
    </div>
  );
}
