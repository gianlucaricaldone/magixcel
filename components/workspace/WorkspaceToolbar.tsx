'use client';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  FileDown,
  Save,
  FilePlus,
  Plus,
  ListPlus,
  Edit3,
  Share2,
  Settings,
  ChevronDown,
  FileEdit,
} from 'lucide-react';

interface WorkspaceToolbarProps {
  onCreateView: () => void;
  onAddView: () => void;
  onExport?: () => void;
  onReplaceFile?: () => void;
  onSave?: () => void;
  onSaveAsNew?: () => void;
  onShare?: () => void;
  onSettings?: () => void;
}

export function WorkspaceToolbar({
  onCreateView,
  onAddView,
  onExport,
  onReplaceFile,
  onSave,
  onSaveAsNew,
  onShare,
  onSettings,
}: WorkspaceToolbarProps) {
  return (
    <div className="h-10 bg-white border-b flex items-center px-4 gap-1">
      {/* File Menu */}
      <DropdownMenu>
        <DropdownMenuTrigger className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded transition-colors">
          File
          <ChevronDown className="h-3 w-3 opacity-50" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuItem onClick={onReplaceFile}>
            <FileEdit className="h-4 w-4 mr-2" />
            Modifica File Input
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={onExport}>
            <FileDown className="h-4 w-4 mr-2" />
            Export
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Session Menu */}
      <DropdownMenu>
        <DropdownMenuTrigger className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded transition-colors">
          Session
          <ChevronDown className="h-3 w-3 opacity-50" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuItem onClick={onSave}>
            <Save className="h-4 w-4 mr-2" />
            Salva
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onSaveAsNew}>
            <FilePlus className="h-4 w-4 mr-2" />
            Salva come nuova Sessione
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* View Menu */}
      <DropdownMenu>
        <DropdownMenuTrigger className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded transition-colors">
          View
          <ChevronDown className="h-3 w-3 opacity-50" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuItem onClick={onCreateView}>
            <Plus className="h-4 w-4 mr-2" />
            Crea View
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onAddView}>
            <ListPlus className="h-4 w-4 mr-2" />
            Applica View
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Share Menu */}
      <DropdownMenu>
        <DropdownMenuTrigger className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded transition-colors">
          Share
          <ChevronDown className="h-3 w-3 opacity-50" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuItem onClick={onShare}>
            <Share2 className="h-4 w-4 mr-2" />
            Condividi Sessione
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Settings Menu */}
      <DropdownMenu>
        <DropdownMenuTrigger className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded transition-colors">
          Settings
          <ChevronDown className="h-3 w-3 opacity-50" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuItem onClick={onSettings}>
            <Settings className="h-4 w-4 mr-2" />
            Preferenze
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
