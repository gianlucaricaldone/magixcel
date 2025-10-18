import * as XLSX from 'xlsx';
import Papa from 'papaparse';

/**
 * Export data to CSV format
 */
export function exportToCSV(data: any[], filename: string) {
  if (!data || data.length === 0) {
    alert('Nessun dato da esportare');
    return;
  }

  const csv = Papa.unparse(data);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  downloadBlob(blob, `${filename}.csv`);
}

/**
 * Export data to Excel format
 */
export function exportToExcel(data: any[], filename: string) {
  if (!data || data.length === 0) {
    alert('Nessun dato da esportare');
    return;
  }

  // Create a new workbook
  const wb = XLSX.utils.book_new();

  // Convert data to worksheet
  const ws = XLSX.utils.json_to_sheet(data);

  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(wb, ws, 'Data');

  // Generate Excel file and trigger download
  XLSX.writeFile(wb, `${filename}.xlsx`);
}

/**
 * Export data to JSON format
 */
export function exportToJSON(data: any[], filename: string) {
  if (!data || data.length === 0) {
    alert('Nessun dato da esportare');
    return;
  }

  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json;charset=utf-8;' });
  downloadBlob(blob, `${filename}.json`);
}

/**
 * Helper function to download a blob
 */
function downloadBlob(blob: Blob, filename: string) {
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.href = url;
  link.download = filename;
  link.style.display = 'none';

  document.body.appendChild(link);
  link.click();

  // Cleanup
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Get filename with timestamp
 */
export function getExportFilename(baseFilename: string, suffix?: string): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
  const namePart = baseFilename.replace(/\.[^/.]+$/, ''); // Remove extension
  const suffixPart = suffix ? `_${suffix}` : '';
  return `${namePart}${suffixPart}_${timestamp}`;
}
