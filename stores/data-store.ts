import { create } from 'zustand';
import { ISheetData } from '@/lib/processing/excel-processor';

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

  // Multi-sheet support
  sheets: ISheetData[];
  activeSheet: string | null;

  // Actions
  setData: (data: any[]) => void;
  setFilteredData: (filteredData: any[]) => void;
  setPage: (page: number) => void;
  setPageSize: (pageSize: number) => void;
  setIsFiltering: (isFiltering: boolean) => void;
  setSorting: (column: string | null, direction: SortDirection) => void;
  setSheets: (sheets: ISheetData[]) => void;
  setActiveSheet: (sheetName: string) => void;
  updateSheetFilteredCount: (sheetName: string, filteredCount: number) => void;
  clearData: () => void;

  // Computed
  getPaginatedData: () => any[];
  getTotalPages: () => number;
  getActiveSheetData: () => ISheetData | null;
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
  sheets: [],
  activeSheet: null,

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

  setSheets: (sheets) => {
    const firstSheet = sheets[0];
    if (firstSheet) {
      set({
        sheets,
        activeSheet: firstSheet.sheetName,
        data: firstSheet.data,
        filteredData: firstSheet.data,
        totalRows: firstSheet.data.length,
        filteredRows: firstSheet.data.length,
        currentPage: 1,
        sortColumn: null,
        sortDirection: null,
      });
    } else {
      set({ sheets, activeSheet: null });
    }
  },

  setActiveSheet: (sheetName) => {
    const state = get();
    const sheet = state.sheets.find((s) => s.sheetName === sheetName);

    if (sheet) {
      set({
        activeSheet: sheetName,
        data: sheet.data,
        filteredData: sheet.data,
        totalRows: sheet.data.length,
        filteredRows: sheet.filteredRowCount ?? sheet.data.length,
        currentPage: 1,
        sortColumn: null,
        sortDirection: null,
      });
    }
  },

  updateSheetFilteredCount: (sheetName, filteredCount) => {
    const state = get();
    const updatedSheets = state.sheets.map((sheet) =>
      sheet.sheetName === sheetName
        ? { ...sheet, filteredRowCount: filteredCount }
        : sheet
    );
    set({ sheets: updatedSheets });
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
      sheets: [],
      activeSheet: null,
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

  getActiveSheetData: () => {
    const state = get();
    if (!state.activeSheet) return null;
    return state.sheets.find((s) => s.sheetName === state.activeSheet) || null;
  },
}));
