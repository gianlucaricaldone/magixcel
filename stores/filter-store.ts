import { create } from 'zustand';
import { IFilter, IFilterGroup, IFilterConfig, FilterCombinator } from '@/types';
import { IFilterPreset } from '@/types/database';
import { nanoid } from 'nanoid';

/**
 * Filter state management with support for grouped filters and per-sheet filters
 */

interface SheetFilters {
  filters: (IFilter | IFilterGroup)[];
  combinator: FilterCombinator;
}

interface FilterState {
  // Per-sheet filters
  filtersBySheet: Record<string, SheetFilters>;
  activeSheet: string | null;

  // Legacy single filters (for CSV files without sheets)
  filters: (IFilter | IFilterGroup)[];
  combinator: FilterCombinator;

  activeFilterHash: string | null;
  presets: IFilterPreset[];
  presetsLoading: boolean;

  // Filter Actions
  addFilter: (filter: Omit<IFilter, 'id'>, groupId?: string) => void;
  updateFilter: (id: string, updates: Partial<IFilter>) => void;
  removeFilter: (id: string) => void;
  addGroup: (combinator: FilterCombinator, parentGroupId?: string) => void;
  updateGroup: (id: string, combinator: FilterCombinator) => void;
  removeGroup: (id: string) => void;
  clearFilters: () => void;
  setCombinator: (combinator: FilterCombinator) => void;
  setActiveFilterHash: (hash: string | null) => void;
  setActiveSheet: (sheetName: string | null) => void;
  restoreFiltersBySheet: (filtersBySheet: Record<string, SheetFilters>) => void;
  getFilterConfig: () => IFilterConfig;

  // Preset Actions
  loadPresets: () => Promise<void>;
  savePreset: (name: string, description?: string, category?: string) => Promise<{ success: boolean; error?: string; preset?: IFilterPreset }>;
  loadPreset: (id: string) => Promise<void>;
  updatePreset: (id: string, updates: { name?: string; description?: string; category?: string; filterConfig?: IFilterConfig }) => Promise<{ success: boolean; error?: string }>;
  deletePreset: (id: string) => Promise<void>;
}

export const useFilterStore = create<FilterState>((set, get) => ({
  filtersBySheet: {},
  activeSheet: null,
  filters: [],
  combinator: 'AND',
  activeFilterHash: null,
  presets: [],
  presetsLoading: false,

  addFilter: (filter, groupId) => {
    const newFilter: IFilter = { ...filter, id: nanoid() };
    const state = get();

    if (state.activeSheet) {
      // Per-sheet filters
      const sheetFilters = state.filtersBySheet[state.activeSheet] || { filters: [], combinator: 'AND' };
      const updatedFilters = groupId
        ? addFilterToGroup(sheetFilters.filters, groupId, newFilter)
        : [...sheetFilters.filters, newFilter];

      set((state) => ({
        filtersBySheet: {
          ...state.filtersBySheet,
          [state.activeSheet!]: {
            ...sheetFilters,
            filters: updatedFilters,
          },
        },
      }));
    } else {
      // Legacy single filters
      if (groupId) {
        set((state) => ({
          filters: addFilterToGroup(state.filters, groupId, newFilter),
        }));
      } else {
        set((state) => ({
          filters: [...state.filters, newFilter],
        }));
      }
    }
  },

  updateFilter: (id, updates) => {
    const state = get();
    if (state.activeSheet) {
      const sheetFilters = state.filtersBySheet[state.activeSheet] || { filters: [], combinator: 'AND' };
      set((state) => ({
        filtersBySheet: {
          ...state.filtersBySheet,
          [state.activeSheet!]: {
            ...sheetFilters,
            filters: updateFilterInTree(sheetFilters.filters, id, updates),
          },
        },
      }));
    } else {
      set((state) => ({
        filters: updateFilterInTree(state.filters, id, updates),
      }));
    }
  },

  removeFilter: (id) => {
    const state = get();
    if (state.activeSheet) {
      const sheetFilters = state.filtersBySheet[state.activeSheet] || { filters: [], combinator: 'AND' };
      set((state) => ({
        filtersBySheet: {
          ...state.filtersBySheet,
          [state.activeSheet!]: {
            ...sheetFilters,
            filters: removeFilterFromTree(sheetFilters.filters, id),
          },
        },
      }));
    } else {
      set((state) => ({
        filters: removeFilterFromTree(state.filters, id),
      }));
    }
  },

  addGroup: (combinator, parentGroupId) => {
    const newGroup: IFilterGroup = {
      id: nanoid(),
      type: 'group',
      combinator,
      filters: [],
    };

    const state = get();
    if (state.activeSheet) {
      const sheetFilters = state.filtersBySheet[state.activeSheet] || { filters: [], combinator: 'AND' };
      const updatedFilters = parentGroupId
        ? addFilterToGroup(sheetFilters.filters, parentGroupId, newGroup)
        : [...sheetFilters.filters, newGroup];

      set((state) => ({
        filtersBySheet: {
          ...state.filtersBySheet,
          [state.activeSheet!]: {
            ...sheetFilters,
            filters: updatedFilters,
          },
        },
      }));
    } else {
      if (parentGroupId) {
        set((state) => ({
          filters: addFilterToGroup(state.filters, parentGroupId, newGroup),
        }));
      } else {
        set((state) => ({
          filters: [...state.filters, newGroup],
        }));
      }
    }
  },

  updateGroup: (id, combinator) => {
    const state = get();
    if (state.activeSheet) {
      const sheetFilters = state.filtersBySheet[state.activeSheet] || { filters: [], combinator: 'AND' };
      set((state) => ({
        filtersBySheet: {
          ...state.filtersBySheet,
          [state.activeSheet!]: {
            ...sheetFilters,
            filters: updateGroupInTree(sheetFilters.filters, id, combinator),
          },
        },
      }));
    } else {
      set((state) => ({
        filters: updateGroupInTree(state.filters, id, combinator),
      }));
    }
  },

  removeGroup: (id) => {
    const state = get();
    if (state.activeSheet) {
      const sheetFilters = state.filtersBySheet[state.activeSheet] || { filters: [], combinator: 'AND' };
      set((state) => ({
        filtersBySheet: {
          ...state.filtersBySheet,
          [state.activeSheet!]: {
            ...sheetFilters,
            filters: removeFilterFromTree(sheetFilters.filters, id),
          },
        },
      }));
    } else {
      set((state) => ({
        filters: removeFilterFromTree(state.filters, id),
      }));
    }
  },

  clearFilters: () => {
    const state = get();
    if (state.activeSheet) {
      set((state) => ({
        filtersBySheet: {
          ...state.filtersBySheet,
          [state.activeSheet!]: {
            filters: [],
            combinator: 'AND',
          },
        },
        activeFilterHash: null,
      }));
    } else {
      set({
        filters: [],
        activeFilterHash: null,
      });
    }
  },

  setCombinator: (combinator) => {
    const state = get();
    if (state.activeSheet) {
      const sheetFilters = state.filtersBySheet[state.activeSheet] || { filters: [], combinator: 'AND' };
      set((state) => ({
        filtersBySheet: {
          ...state.filtersBySheet,
          [state.activeSheet!]: {
            ...sheetFilters,
            combinator,
          },
        },
      }));
    } else {
      set({ combinator });
    }
  },

  setActiveFilterHash: (hash) => set({ activeFilterHash: hash }),

  setActiveSheet: (sheetName) => {
    set({ activeSheet: sheetName });
    // Initialize sheet filters if not exists
    if (sheetName) {
      const state = get();
      if (!state.filtersBySheet[sheetName]) {
        set((state) => ({
          filtersBySheet: {
            ...state.filtersBySheet,
            [sheetName]: {
              filters: [],
              combinator: 'AND',
            },
          },
        }));
      }
    }
  },

  restoreFiltersBySheet: (filtersBySheet) => {
    set({ filtersBySheet });
  },

  getFilterConfig: () => {
    const state = get();
    if (state.activeSheet) {
      const sheetFilters = state.filtersBySheet[state.activeSheet] || { filters: [], combinator: 'AND' };
      return {
        filters: sheetFilters.filters,
        combinator: sheetFilters.combinator,
      };
    }
    return {
      filters: state.filters,
      combinator: state.combinator,
    };
  },

  // Preset Actions
  loadPresets: async () => {
    set({ presetsLoading: true });
    try {
      const response = await fetch('/api/filter-presets');
      const result = await response.json();
      if (result.success) {
        set({ presets: result.presets, presetsLoading: false });
      } else {
        console.error('Failed to load presets:', result.error);
        set({ presetsLoading: false });
      }
    } catch (error) {
      console.error('Error loading presets:', error);
      set({ presetsLoading: false });
    }
  },

  savePreset: async (name, description = '', category = 'Custom') => {
    const state = get();
    const filterConfig = state.getFilterConfig();

    try {
      const response = await fetch('/api/filter-presets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          description,
          category,
          filterConfig,
        }),
      });

      const result = await response.json();

      if (result.success) {
        // Reload presets to get updated list
        await get().loadPresets();
        return { success: true, preset: result.preset };
      } else {
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error('Error saving preset:', error);
      return { success: false, error: 'Failed to save preset' };
    }
  },

  loadPreset: async (id) => {
    try {
      const response = await fetch(`/api/filter-presets/${id}`);
      const result = await response.json();

      if (result.success) {
        const config: IFilterConfig = JSON.parse(result.preset.filter_config);
        const state = get();

        if (state.activeSheet) {
          // Load preset to active sheet
          set((state) => ({
            filtersBySheet: {
              ...state.filtersBySheet,
              [state.activeSheet!]: {
                filters: config.filters,
                combinator: config.combinator,
              },
            },
          }));
        } else {
          // Legacy single filters
          set({
            filters: config.filters,
            combinator: config.combinator,
          });
        }
      } else {
        console.error('Failed to load preset:', result.error);
      }
    } catch (error) {
      console.error('Error loading preset:', error);
    }
  },

  updatePreset: async (id, updates) => {
    try {
      const body: any = {};
      if (updates.name !== undefined) body.name = updates.name;
      if (updates.description !== undefined) body.description = updates.description;
      if (updates.category !== undefined) body.category = updates.category;
      if (updates.filterConfig !== undefined) body.filterConfig = updates.filterConfig;

      const response = await fetch(`/api/filter-presets/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const result = await response.json();

      if (result.success) {
        // Reload presets to get updated list
        await get().loadPresets();
        return { success: true };
      } else {
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error('Error updating preset:', error);
      return { success: false, error: 'Failed to update preset' };
    }
  },

  deletePreset: async (id) => {
    try {
      const response = await fetch(`/api/filter-presets/${id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.success) {
        // Reload presets to get updated list
        await get().loadPresets();
      } else {
        console.error('Failed to delete preset:', result.error);
      }
    } catch (error) {
      console.error('Error deleting preset:', error);
    }
  },
}));

// Helper functions

function addFilterToGroup(
  filters: (IFilter | IFilterGroup)[],
  groupId: string,
  newFilter: IFilter | IFilterGroup
): (IFilter | IFilterGroup)[] {
  return filters.map((item) => {
    if (item.id === groupId && 'type' in item && item.type === 'group') {
      return {
        ...item,
        filters: [...item.filters, newFilter],
      };
    }
    if ('type' in item && item.type === 'group') {
      return {
        ...item,
        filters: addFilterToGroup(item.filters, groupId, newFilter),
      };
    }
    return item;
  });
}

function updateFilterInTree(
  filters: (IFilter | IFilterGroup)[],
  id: string,
  updates: Partial<IFilter>
): (IFilter | IFilterGroup)[] {
  return filters.map((item) => {
    if (item.id === id && !('type' in item)) {
      return { ...item, ...updates };
    }
    if ('type' in item && item.type === 'group') {
      return {
        ...item,
        filters: updateFilterInTree(item.filters, id, updates),
      };
    }
    return item;
  });
}

function updateGroupInTree(
  filters: (IFilter | IFilterGroup)[],
  id: string,
  combinator: FilterCombinator
): (IFilter | IFilterGroup)[] {
  return filters.map((item) => {
    if (item.id === id && 'type' in item && item.type === 'group') {
      return { ...item, combinator };
    }
    if ('type' in item && item.type === 'group') {
      return {
        ...item,
        filters: updateGroupInTree(item.filters, id, combinator),
      };
    }
    return item;
  });
}

function removeFilterFromTree(
  filters: (IFilter | IFilterGroup)[],
  id: string
): (IFilter | IFilterGroup)[] {
  return filters
    .filter((item) => item.id !== id)
    .map((item) => {
      if ('type' in item && item.type === 'group') {
        return {
          ...item,
          filters: removeFilterFromTree(item.filters, id),
        };
      }
      return item;
    });
}
