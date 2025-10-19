'use client';

interface TableStatsBarProps {
  totalRows: number;
  totalColumns: number;
  filteredRows: number;
}

export function TableStatsBar({
  totalRows,
  totalColumns,
  filteredRows,
}: TableStatsBarProps) {
  const isFiltered = filteredRows !== totalRows;

  return (
    <div className="flex items-center justify-between px-4 py-2 bg-slate-50 border-b border-slate-200">
      {/* Left: Stats */}
      <div className="flex items-center gap-2 text-sm">
        <div className="flex items-center gap-2">
          <span className="text-slate-600">Righe:</span>
          <span className="font-semibold text-slate-900">{totalRows.toLocaleString()}</span>
        </div>
        <span className="text-slate-300">•</span>
        <div className="flex items-center gap-2">
          <span className="text-slate-600">Colonne:</span>
          <span className="font-semibold text-slate-900">{totalColumns}</span>
        </div>
        {isFiltered && (
          <>
            <span className="text-slate-300">•</span>
            <div className="flex items-center gap-2">
              <span className="text-blue-600">Filtrate:</span>
              <span className="font-semibold text-blue-700">{filteredRows.toLocaleString()}</span>
            </div>
          </>
        )}
      </div>

      {/* Right: Additional info if needed */}
      <div className="text-xs text-slate-500">
        {isFiltered && (
          <span>Mostrando {((filteredRows / totalRows) * 100).toFixed(1)}% dei dati</span>
        )}
      </div>
    </div>
  );
}
