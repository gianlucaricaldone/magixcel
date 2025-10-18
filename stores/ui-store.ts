import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * UI state management
 * Handles sidebar state, user preferences, and UI settings
 */

type SidebarTab = 'filters' | 'presets' | 'analysis';

interface UIState {
  // Sidebar
  sidebarCollapsed: boolean;
  sidebarActiveTab: SidebarTab;
  sidebarWidth: number;

  // Table
  columnWidths: Record<string, number>;
  pinnedColumns: string[];

  // Preferences
  darkMode: boolean;
  compactMode: boolean;
  showRowNumbers: boolean;

  // Actions
  toggleSidebar: () => void;
  setSidebarTab: (tab: SidebarTab) => void;
  setSidebarWidth: (width: number) => void;
  setColumnWidth: (column: string, width: number) => void;
  pinColumn: (column: string) => void;
  unpinColumn: (column: string) => void;
  toggleDarkMode: () => void;
  toggleCompactMode: () => void;
  toggleRowNumbers: () => void;
  reset: () => void;
}

const defaultState = {
  sidebarCollapsed: false,
  sidebarActiveTab: 'filters' as SidebarTab,
  sidebarWidth: 320,
  columnWidths: {},
  pinnedColumns: [],
  darkMode: false,
  compactMode: false,
  showRowNumbers: true,
};

export const useUIStore = create<UIState>()(
  persist(
    (set, get) => ({
      ...defaultState,

      toggleSidebar: () =>
        set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),

      setSidebarTab: (tab) => set({ sidebarActiveTab: tab }),

      setSidebarWidth: (width) => set({ sidebarWidth: width }),

      setColumnWidth: (column, width) =>
        set((state) => ({
          columnWidths: { ...state.columnWidths, [column]: width },
        })),

      pinColumn: (column) =>
        set((state) => ({
          pinnedColumns: [...state.pinnedColumns, column],
        })),

      unpinColumn: (column) =>
        set((state) => ({
          pinnedColumns: state.pinnedColumns.filter((c) => c !== column),
        })),

      toggleDarkMode: () => set((state) => ({ darkMode: !state.darkMode })),

      toggleCompactMode: () =>
        set((state) => ({ compactMode: !state.compactMode })),

      toggleRowNumbers: () =>
        set((state) => ({ showRowNumbers: !state.showRowNumbers })),

      reset: () => set(defaultState),
    }),
    {
      name: 'magixcel-ui-preferences',
      partialize: (state) => ({
        sidebarCollapsed: state.sidebarCollapsed,
        sidebarActiveTab: state.sidebarActiveTab,
        sidebarWidth: state.sidebarWidth,
        columnWidths: state.columnWidths,
        pinnedColumns: state.pinnedColumns,
        darkMode: state.darkMode,
        compactMode: state.compactMode,
        showRowNumbers: state.showRowNumbers,
      }),
    }
  )
);
