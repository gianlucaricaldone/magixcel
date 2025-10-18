'use client';

import { Keyboard, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getModifierKey } from '@/lib/hooks/useKeyboardShortcuts';

interface KeyboardShortcutsHelpProps {
  onClose: () => void;
}

export function KeyboardShortcutsHelp({ onClose }: KeyboardShortcutsHelpProps) {
  const modKey = getModifierKey();

  const shortcuts = [
    {
      keys: [modKey, 'F'],
      description: 'Focus global search',
    },
    {
      keys: [modKey, 'K'],
      description: 'Open filter builder',
    },
    {
      keys: [modKey, 'S'],
      description: 'Save current filters as preset',
    },
    {
      keys: ['Escape'],
      description: 'Clear search or close modals',
    },
    {
      keys: ['?'],
      description: 'Show keyboard shortcuts',
    },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <Keyboard className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Keyboard Shortcuts</h2>
              <p className="text-xs text-slate-500">Quick access to common actions</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-md transition-colors"
          >
            <X className="h-5 w-5 text-slate-500" />
          </button>
        </div>

        {/* Shortcuts List */}
        <div className="p-6 space-y-3">
          {shortcuts.map((shortcut, idx) => (
            <div key={idx} className="flex items-center justify-between py-2">
              <span className="text-sm text-slate-700">{shortcut.description}</span>
              <div className="flex items-center gap-1">
                {shortcut.keys.map((key, keyIdx) => (
                  <span key={keyIdx} className="flex items-center gap-1">
                    <kbd className="px-2.5 py-1.5 text-xs font-semibold text-slate-800 bg-slate-100 border border-slate-300 rounded-md shadow-sm">
                      {key}
                    </kbd>
                    {keyIdx < shortcut.keys.length - 1 && (
                      <span className="text-slate-400 text-xs">+</span>
                    )}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 rounded-b-lg border-t border-slate-200">
          <p className="text-xs text-slate-600 text-center">
            Press <kbd className="px-2 py-0.5 text-xs bg-white border border-slate-300 rounded">?</kbd> to toggle this panel
          </p>
        </div>
      </div>
    </div>
  );
}
