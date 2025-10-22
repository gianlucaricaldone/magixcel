'use client';

import { IView } from '@/types/database';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Database, Filter } from 'lucide-react';

interface ViewPickerDialogProps {
  isOpen: boolean;
  onClose: () => void;
  views: IView[];
  onSelectView: (view: IView) => void;
  openViewIds: string[]; // IDs of already open views
}

export function ViewPickerDialog({
  isOpen,
  onClose,
  views,
  onSelectView,
  openViewIds,
}: ViewPickerDialogProps) {
  const handleSelectView = (view: IView) => {
    onSelectView(view);
    onClose();
  };

  // Group views by category
  const viewsByCategory = views.reduce((acc, view) => {
    const category = view.category || 'Custom';
    if (!acc[category]) acc[category] = [];
    acc[category].push(view);
    return acc;
  }, {} as Record<string, IView[]>);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Aggiungi View</DialogTitle>
          <DialogDescription>
            Seleziona una view da aprire nel workspace
          </DialogDescription>
        </DialogHeader>

        <div className="overflow-y-auto py-4 space-y-6">
          {Object.entries(viewsByCategory).map(([category, categoryViews]) => (
            <div key={category}>
              <div className="flex items-center gap-2 mb-3">
                <div className="h-px flex-1 bg-slate-200" />
                <h4 className="text-sm font-semibold text-slate-700">{category}</h4>
                <div className="h-px flex-1 bg-slate-200" />
              </div>

              <div className="grid grid-cols-1 gap-2">
                {categoryViews.map((view) => {
                  const isOpen = openViewIds.includes(view.id);
                  const filterConfig = JSON.parse(view.filter_config || '{"filters": []}');
                  const filterCount = filterConfig.filters?.length || 0;

                  return (
                    <button
                      key={view.id}
                      onClick={() => !isOpen && handleSelectView(view)}
                      disabled={isOpen}
                      className={`
                        w-full p-4 border rounded-lg text-left transition-all
                        ${
                          isOpen
                            ? 'bg-slate-50 border-slate-200 cursor-not-allowed opacity-50'
                            : 'hover:bg-slate-50 hover:border-blue-500 cursor-pointer'
                        }
                      `}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Database className="h-4 w-4 text-slate-500" />
                            <h4 className="font-medium text-slate-900">{view.name}</h4>
                            {isOpen && (
                              <Badge variant="secondary" className="text-xs">
                                Già aperto
                              </Badge>
                            )}
                          </div>
                          {view.description && (
                            <p className="text-sm text-slate-600 mt-1">
                              {view.description}
                            </p>
                          )}
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant="outline" className="text-xs">
                              <Filter className="h-3 w-3 mr-1" />
                              {filterCount} {filterCount === 1 ? 'filter' : 'filters'}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          {views.length === 0 && (
            <div className="text-center py-8">
              <p className="text-sm text-slate-600">
                Nessuna view disponibile. Crea la tua prima view!
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
