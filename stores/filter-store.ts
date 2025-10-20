import { create } from 'zustand';
import { IFilter, IFilterGroup, IFilterConfig, FilterCombinator } from '@/types';
import { IView, ViewType } from '@/types/database';
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
  views: IView[];
  viewsLoading: boolean;
  currentViewId: string | null;

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

  // View Actions
  loadViews: (workspaceId?: string, sessionId?: string, sheetName?: string | null) => Promise<void>;
  saveView: (
    name: string,
    options?: {
      description?: string;
      category?: string;
      viewType?: ViewType;
      isPublic?: boolean;
      bindToSession?: boolean;
      workspaceId?: string;
      sessionId?: string;
      snapshotData?: any[];
    }
  ) => Promise<{ success: boolean; error?: string; view?: IView; publicLink?: string }>;
  loadView: (id: string) => Promise<void>;
  updateView: (id: string, updates: { name?: string; description?: string; category?: string; filterConfig?: IFilterConfig; isPublic?: boolean }) => Promise<{ success: boolean; error?: string }>;
  deleteView: (id: string) => Promise<void>;
  shareView: (id: string) => Promise<string | null>;

  // Backward compatibility aliases
  loadPresets: () => Promise<void>;
  savePreset: (name: string, description?: string, category?: string) => Promise<{ success: boolean; error?: string; preset?: IView }>;
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
  views: [],
  viewsLoading: false,
  currentViewId: null,

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

  // View Actions
  loadViews: async (workspaceId, sessionId, sheetName) => {
    set({ viewsLoading: true });
    try {
      const params = new URLSearchParams();
      if (workspaceId) params.append('workspaceId', workspaceId);
      if (sessionId) params.append('sessionId', sessionId);
      if (sheetName !== undefined) params.append('sheetName', sheetName || '');

      const url = params.toString() ? `/api/views?${params.toString()}` : '/api/views';
      const response = await fetch(url);
      const result = await response.json();
      if (result.success) {
        set({ views: result.views, viewsLoading: false });
      } else {
        console.error('Failed to load views:', result.error);
        set({ viewsLoading: false });
      }
    } catch (error) {
      console.error('Error loading views:', error);
      set({ viewsLoading: false });
    }
  },

  saveView: async (name, options = {}) => {
    const state = get();
    const filterConfig = state.getFilterConfig();

    if (!options.workspaceId) {
      return { success: false, error: 'Workspace ID is required' };
    }

    try {
      const response = await fetch('/api/views', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          description: options.description || '',
          category: options.category || 'Custom',
          filterConfig,
          viewType: options.viewType || 'filters_only',
          snapshotData: options.snapshotData,
          isPublic: options.isPublic || false,
          bindToSession: options.bindToSession || false,
          workspaceId: options.workspaceId,
          sessionId: options.sessionId,
          sheetName: state.activeSheet, // Include current sheet name
        }),
      });

      const result = await response.json();

      if (result.success) {
        // Reload views to get updated list
        const currentState = get();
        await get().loadViews(options.workspaceId, options.sessionId, currentState.activeSheet);
        set({ currentViewId: result.view.id });
        return {
          success: true,
          view: result.view,
          publicLink: result.publicLink
        };
      } else {
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error('Error saving view:', error);
      return { success: false, error: 'Failed to save view' };
    }
  },

  loadView: async (id) => {
    try {
      const response = await fetch(`/api/views/${id}`);
      const result = await response.json();

      if (result.success) {
        const config: IFilterConfig = JSON.parse(result.view.filter_config);
        const state = get();

        if (state.activeSheet) {
          // Load view to active sheet
          set((state) => ({
            filtersBySheet: {
              ...state.filtersBySheet,
              [state.activeSheet!]: {
                filters: config.filters,
                combinator: config.combinator,
              },
            },
            currentViewId: id,
          }));
        } else {
          // Legacy single filters
          set({
            filters: config.filters,
            combinator: config.combinator,
            currentViewId: id,
          });
        }
      } else {
        console.error('Failed to load view:', result.error);
      }
    } catch (error) {
      console.error('Error loading view:', error);
    }
  },

  updateView: async (id, updates) => {
    try {
      const body: any = {};
      if (updates.name !== undefined) body.name = updates.name;
      if (updates.description !== undefined) body.description = updates.description;
      if (updates.category !== undefined) body.category = updates.category;
      if (updates.filterConfig !== undefined) body.filterConfig = updates.filterConfig;
      if (updates.isPublic !== undefined) body.isPublic = updates.isPublic;

      const response = await fetch(`/api/views/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const result = await response.json();

      if (result.success) {
        // Reload views to get updated list
        await get().loadViews();
        return { success: true };
      } else {
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error('Error updating view:', error);
      return { success: false, error: 'Failed to update view' };
    }
  },

  deleteView: async (id) => {
    try {
      const response = await fetch(`/api/views/${id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.success) {
        // Reload views to get updated list
        await get().loadViews();
        // Clear current view if it was the deleted one
        const state = get();
        if (state.currentViewId === id) {
          set({ currentViewId: null });
        }
      } else {
        console.error('Failed to delete view:', result.error);
      }
    } catch (error) {
      console.error('Error deleting view:', error);
    }
  },

  shareView: async (id) => {
    try {
      // Get view to check if it's already public
      const response = await fetch(`/api/views/${id}`);
      const result = await response.json();

      if (result.success && result.view) {
        if (result.view.is_public && result.view.public_link_id) {
          return `/public/view/${result.view.public_link_id}`;
        } else {
          // Make view public if not already
          const updateResponse = await fetch(`/api/views/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ isPublic: true }),
          });

          const updateResult = await updateResponse.json();
          if (updateResult.success && updateResult.view.public_link_id) {
            await get().loadViews();
            return `/public/view/${updateResult.view.public_link_id}`;
          }
        }
      }
      return null;
    } catch (error) {
      console.error('Error sharing view:', error);
      return null;
    }
  },

  // Backward compatibility aliases
  loadPresets: async () => get().loadViews(),
  savePreset: async (name, description, category) => {
    const result = await get().saveView(name, { description, category });
    return { success: result.success, error: result.error, preset: result.view };
  },
  loadPreset: async (id) => get().loadView(id),
  updatePreset: async (id, updates) => get().updateView(id, updates),
  deletePreset: async (id) => get().deleteView(id),
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
