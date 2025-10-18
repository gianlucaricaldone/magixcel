import { create } from 'zustand';

/**
 * Data state management
 */

type SortDirection = 'asc' | 'desc' | null;

interface DataState {
  data: any[];
  filteredData: any[];
  totalRows: number;
  filteredRows: number;
  currentPage: number;
  pageSize: number;
  isFiltering: boolean;
  sortColumn: string | null;
  sortDirection: SortDirection;

  // Actions
  setData: (data: any[]) => void;
  setFilteredData: (filteredData: any[]) => void;
  setPage: (page: number) => void;
  setPageSize: (pageSize: number) => void;
  setIsFiltering: (isFiltering: boolean) => void;
  setSorting: (column: string | null, direction: SortDirection) => void;
  clearData: () => void;

  // Computed
  getPaginatedData: () => any[];
  getTotalPages: () => number;
}

export const useDataStore = create<DataState>((set, get) => ({
  data: [],
  filteredData: [],
  totalRows: 0,
  filteredRows: 0,
  currentPage: 1,
  pageSize: 100,
  isFiltering: false,
  sortColumn: null,
  sortDirection: null,

  setData: (data) =>
    set({
      data,
      filteredData: data,
      totalRows: data.length,
      filteredRows: data.length,
      currentPage: 1,
    }),

  setFilteredData: (filteredData) =>
    set({
      filteredData,
      filteredRows: filteredData.length,
      currentPage: 1,
      isFiltering: false,
    }),

  setPage: (page) => set({ currentPage: page }),

  setPageSize: (pageSize) =>
    set({
      pageSize,
      currentPage: 1,
    }),

  setIsFiltering: (isFiltering) => set({ isFiltering }),

  setSorting: (column, direction) => {
    const state = get();

    if (!column || !direction) {
      set({ sortColumn: null, sortDirection: null });
      return;
    }

    const sorted = [...state.filteredData].sort((a, b) => {
      const aVal = a[column];
      const bVal = b[column];

      if (aVal === bVal) return 0;
      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;

      const comparison = aVal < bVal ? -1 : 1;
      return direction === 'asc' ? comparison : -comparison;
    });

    set({
      filteredData: sorted,
      sortColumn: column,
      sortDirection: direction,
      currentPage: 1,
    });
  },

  clearData: () =>
    set({
      data: [],
      filteredData: [],
      totalRows: 0,
      filteredRows: 0,
      currentPage: 1,
      isFiltering: false,
      sortColumn: null,
      sortDirection: null,
    }),

  getPaginatedData: () => {
    const state = get();
    const start = (state.currentPage - 1) * state.pageSize;
    const end = start + state.pageSize;
    return state.filteredData.slice(start, end);
  },

  getTotalPages: () => {
    const state = get();
    return Math.ceil(state.filteredRows / state.pageSize);
  },
}));
