'use client';

import { useState } from 'react';
import { IView } from '@/types/database';
import { DataTable } from '@/components/table/DataTable';
import { ViewDashboard } from '@/components/charts/ViewDashboard';
import { TableStatsBar } from '@/components/dashboard/TableStatsBar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Database, BarChart3, MoreVertical, Check } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface ActiveViewPanelProps {
  view: IView;
  data: any[];
  columns: string[];
  columnCount: number;
  onUpdateView: (updates: Partial<IView>) => void;
  lastSaved?: Date;
}

type SubTab = 'data' | 'charts';

export function ActiveViewPanel({
  view,
  data,
  columns,
  columnCount,
  onUpdateView,
  lastSaved,
}: ActiveViewPanelProps) {
  const [activeSubTab, setActiveSubTab] = useState<SubTab>('data');
  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [editedName, setEditedName] = useState(view.name);
  const [editedDescription, setEditedDescription] = useState(view.description || '');

  const filterConfig = JSON.parse(view.filter_config || '{"filters": [], "combinator": "AND"}');
  const filterCount = filterConfig.filters?.length || 0;

  const handleSaveName = () => {
    if (editedName.trim() !== view.name) {
      onUpdateView({ name: editedName.trim() });
    }
    setIsEditingName(false);
  };

  const handleSaveDescription = () => {
    if (editedDescription !== view.description) {
      onUpdateView({ description: editedDescription });
    }
    setIsEditingDescription(false);
  };

  return (
    <div className="flex-1 flex flex-col bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="px-6 py-4">
          <div className="flex items-start justify-between">
            {/* Title & Description */}
            <div className="flex-1 min-w-0 mr-4">
              {/* Editable Title */}
              {isEditingName ? (
                <div className="flex items-center gap-2 mb-2">
                  <input
                    type="text"
                    value={editedName}
                    onChange={(e) => setEditedName(e.target.value)}
                    onBlur={handleSaveName}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveName();
                      if (e.key === 'Escape') {
                        setEditedName(view.name);
                        setIsEditingName(false);
                      }
                    }}
                    autoFocus
                    className="text-xl font-bold text-slate-900 border-b-2 border-blue-500 focus:outline-none bg-transparent w-full"
                  />
                  <Check
                    className="h-5 w-5 text-green-600 cursor-pointer flex-shrink-0"
                    onClick={handleSaveName}
                  />
                </div>
              ) : (
                <h2
                  onClick={() => setIsEditingName(true)}
                  className="text-xl font-bold text-slate-900 cursor-pointer hover:text-blue-600 transition-colors mb-2"
                >
                  {view.name}
                </h2>
              )}

              {/* Editable Description */}
              {isEditingDescription ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={editedDescription}
                    onChange={(e) => setEditedDescription(e.target.value)}
                    onBlur={handleSaveDescription}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveDescription();
                      if (e.key === 'Escape') {
                        setEditedDescription(view.description || '');
                        setIsEditingDescription(false);
                      }
                    }}
                    autoFocus
                    placeholder="Add description..."
                    className="text-sm text-slate-600 border-b border-slate-300 focus:border-blue-500 focus:outline-none bg-transparent w-full"
                  />
                  <Check
                    className="h-4 w-4 text-green-600 cursor-pointer flex-shrink-0"
                    onClick={handleSaveDescription}
                  />
                </div>
              ) : (
                <p
                  onClick={() => setIsEditingDescription(true)}
                  className="text-sm text-slate-600 cursor-pointer hover:text-blue-600 transition-colors"
                >
                  {view.description || 'Click to add description...'}
                </p>
              )}

              {/* Meta Info */}
              <div className="flex items-center gap-3 mt-3">
                <Badge variant="outline" className="text-xs">
                  {filterCount} {filterCount === 1 ? 'filter' : 'filters'}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {data.length} rows
                </Badge>
                {lastSaved && (
                  <span className="text-xs text-slate-500">
                    ✓ Saved {new Date(lastSaved).toLocaleTimeString()}
                  </span>
                )}
              </div>
            </div>

            {/* Actions Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem>
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Export to PowerPoint
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Database className="h-4 w-4 mr-2" />
                  Export to PDF
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>Duplicate View</DropdownMenuItem>
                <DropdownMenuItem>Save as Template</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-red-600">
                  Delete View
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Sub Tabs */}
        <div className="px-6 border-t">
          <div className="flex gap-1">
            <button
              onClick={() => setActiveSubTab('data')}
              className={`
                px-4 py-2.5 text-sm font-medium transition-all relative
                ${
                  activeSubTab === 'data'
                    ? 'text-blue-600'
                    : 'text-slate-600 hover:text-slate-900'
                }
              `}
            >
              <div className="flex items-center gap-2">
                <Database className="h-4 w-4" />
                Data
              </div>
              {activeSubTab === 'data' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
              )}
            </button>

            <button
              onClick={() => setActiveSubTab('charts')}
              className={`
                px-4 py-2.5 text-sm font-medium transition-all relative
                ${
                  activeSubTab === 'charts'
                    ? 'text-blue-600'
                    : 'text-slate-600 hover:text-slate-900'
                }
              `}
            >
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Charts
              </div>
              {activeSubTab === 'charts' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {activeSubTab === 'data' ? (
          <div className="h-full bg-white flex flex-col">
            <TableStatsBar
              totalRows={data.length}
              totalColumns={columnCount}
              filteredRows={data.length}
            />
            <div className="flex-1 overflow-hidden">
              <DataTable columns={columns} />
            </div>
          </div>
        ) : (
          <ViewDashboard
            view={view}
            data={data}
            columns={columns}
            isTemporary={false}
          />
        )}
      </div>
    </div>
  );
}
