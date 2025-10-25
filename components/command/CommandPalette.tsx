'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Search,
  Zap,
  Filter,
  BarChart3,
  Download,
  Share2,
  Layers,
  FileSpreadsheet,
  Command as CommandIcon,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

interface CommandItem {
  id: string;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  shortcut?: string;
  category: string;
  disabled?: boolean;
}

const COMMAND_CATEGORIES = {
  navigation: 'Navigation',
  actions: 'Actions',
  views: 'Views',
  export: 'Export',
};

const PLACEHOLDER_COMMANDS: CommandItem[] = [
  {
    id: 'quick-filter',
    label: 'Quick Filter',
    description: 'Apply filters with natural language',
    icon: Filter,
    shortcut: '⌘F',
    category: COMMAND_CATEGORIES.actions,
    disabled: true,
  },
  {
    id: 'create-chart',
    label: 'Create Chart',
    description: 'Generate a new chart from current data',
    icon: BarChart3,
    shortcut: '⌘N',
    category: COMMAND_CATEGORIES.actions,
    disabled: true,
  },
  {
    id: 'new-view',
    label: 'New View',
    description: 'Create a new dashboard view',
    icon: Layers,
    category: COMMAND_CATEGORIES.views,
    disabled: true,
  },
  {
    id: 'export-excel',
    label: 'Export to Excel',
    description: 'Download current data as Excel file',
    icon: FileSpreadsheet,
    shortcut: '⌘E',
    category: COMMAND_CATEGORIES.export,
    disabled: true,
  },
  {
    id: 'export-ppt',
    label: 'Export to PowerPoint',
    description: 'Create presentation from charts',
    icon: Download,
    category: COMMAND_CATEGORIES.export,
    disabled: true,
  },
  {
    id: 'share-view',
    label: 'Share View',
    description: 'Generate shareable link for current view',
    icon: Share2,
    shortcut: '⌘S',
    category: COMMAND_CATEGORIES.actions,
    disabled: true,
  },
];

export function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const [searchQuery, setSearchQuery] = useState('');

  // Close on Escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Filter commands based on search
  const filteredCommands = PLACEHOLDER_COMMANDS.filter((cmd) =>
    cmd.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
    cmd.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Group by category
  const commandsByCategory = filteredCommands.reduce((acc, cmd) => {
    if (!acc[cmd.category]) {
      acc[cmd.category] = [];
    }
    acc[cmd.category].push(cmd);
    return acc;
  }, {} as Record<string, CommandItem[]>);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed left-1/2 top-[20vh] -translate-x-1/2 w-full max-w-2xl z-50 animate-in fade-in slide-in-from-top-4 duration-200">
        <div className="bg-white rounded-lg shadow-2xl border border-slate-200 overflow-hidden">
          {/* Search Input */}
          <div className="flex items-center gap-3 px-4 py-3 border-b">
            <Search className="h-5 w-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search commands..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 outline-none text-slate-900 placeholder:text-slate-400"
              autoFocus
            />
            <Badge variant="outline" className="text-xs">
              <CommandIcon className="h-3 w-3 mr-1" />K
            </Badge>
          </div>

          {/* Coming Soon Banner */}
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 px-4 py-3 border-b border-purple-100">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-purple-600" />
              <p className="text-sm font-medium text-purple-900">
                🚧 Command Palette - Coming Soon
              </p>
            </div>
            <p className="text-xs text-purple-700 mt-1">
              Quick access to all actions with keyboard shortcuts. Commands below are preview only.
            </p>
          </div>

          {/* Commands List */}
          <div className="max-h-[400px] overflow-y-auto">
            {Object.entries(commandsByCategory).length === 0 ? (
              <div className="px-4 py-8 text-center text-slate-500">
                <p className="text-sm">No commands found</p>
              </div>
            ) : (
              <div className="py-2">
                {Object.entries(commandsByCategory).map(([category, commands]) => (
                  <div key={category}>
                    {/* Category Header */}
                    <div className="px-4 py-2">
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        {category}
                      </p>
                    </div>

                    {/* Category Commands */}
                    {commands.map((cmd) => {
                      const Icon = cmd.icon;
                      return (
                        <button
                          key={cmd.id}
                          disabled={cmd.disabled}
                          className={`
                            w-full flex items-center gap-3 px-4 py-2.5 transition-colors
                            ${
                              cmd.disabled
                                ? 'cursor-not-allowed opacity-50'
                                : 'hover:bg-slate-50 cursor-pointer'
                            }
                          `}
                        >
                          <div className="flex-shrink-0">
                            <div className={`
                              w-8 h-8 rounded-lg flex items-center justify-center
                              ${cmd.disabled ? 'bg-slate-100' : 'bg-blue-100'}
                            `}>
                              <Icon className={`h-4 w-4 ${cmd.disabled ? 'text-slate-400' : 'text-blue-600'}`} />
                            </div>
                          </div>
                          <div className="flex-1 text-left min-w-0">
                            <p className="text-sm font-medium text-slate-900 truncate">
                              {cmd.label}
                            </p>
                            <p className="text-xs text-slate-500 truncate">
                              {cmd.description}
                            </p>
                          </div>
                          {cmd.shortcut && (
                            <div className="flex-shrink-0">
                              <kbd className="px-2 py-1 text-xs font-mono bg-slate-100 text-slate-600 rounded border border-slate-200">
                                {cmd.shortcut}
                              </kbd>
                            </div>
                          )}
                          {cmd.disabled && (
                            <Badge variant="secondary" className="text-[10px] h-5">
                              Soon
                            </Badge>
                          )}
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-2 border-t bg-slate-50 flex items-center justify-between">
            <div className="flex items-center gap-3 text-xs text-slate-500">
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[10px] font-mono">↑↓</kbd>
                Navigate
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[10px] font-mono">↵</kbd>
                Select
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[10px] font-mono">Esc</kbd>
                Close
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Tier 3: Power User Tools
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

export function useCommandPalette() {
  const [isOpen, setIsOpen] = useState(false);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen((prev) => !prev), []);

  // Global keyboard shortcut (⌘K or Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        toggle();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [toggle]);

  return { isOpen, open, close, toggle };
}
