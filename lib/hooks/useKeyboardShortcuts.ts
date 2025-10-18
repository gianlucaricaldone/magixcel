import { useEffect } from 'react';

export interface KeyboardShortcut {
  key: string;
  ctrlOrCmd?: boolean;
  shift?: boolean;
  alt?: boolean;
  handler: (event: KeyboardEvent) => void;
  description: string;
}

/**
 * Custom hook for managing keyboard shortcuts
 * Handles both Cmd (Mac) and Ctrl (Windows/Linux) modifiers
 */
export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[]) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      for (const shortcut of shortcuts) {
        const matchesKey = event.key.toLowerCase() === shortcut.key.toLowerCase();
        const matchesCtrlOrCmd = shortcut.ctrlOrCmd
          ? event.ctrlKey || event.metaKey
          : !event.ctrlKey && !event.metaKey;
        const matchesShift = shortcut.shift ? event.shiftKey : !event.shiftKey;
        const matchesAlt = shortcut.alt ? event.altKey : !event.altKey;

        if (matchesKey && matchesCtrlOrCmd && matchesShift && matchesAlt) {
          event.preventDefault();
          shortcut.handler(event);
          break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts]);
}

/**
 * Gets the appropriate modifier key label for the current platform
 */
export function getModifierKey(): string {
  if (typeof navigator === 'undefined') return 'Ctrl';
  return navigator.platform.toLowerCase().includes('mac') ? '⌘' : 'Ctrl';
}
