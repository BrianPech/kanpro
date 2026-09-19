import type { ReportColumn } from "../types/reports";

/**
 * Exports tabular data to a well-formatted CSV file with UTF-8 BOM encoding.
 * Ensures proper compatibility with Microsoft Excel, Apple Numbers, and Google Sheets,
 * preserving accented Spanish characters and currency/date formatting.
 */
export function exportReportToCSV({
  filename,
  columns,
  data,
}: {
  filename: string;
  columns: ReportColumn[];
  data: Record<string, any>[];
}): void {
  if (typeof window === "undefined") return;

  const escapeCSV = (val: any): string => {
    if (val === null || val === undefined) return "";
    const str = String(val);
    if (str.includes(",") || str.includes('"') || str.includes("\n") || str.includes("\r")) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  // Header row
  const headerRow = columns.map((col) => escapeCSV(col.label)).join(",");

  // Data rows
  const dataRows = data.map((row) =>
    columns
      .map((col) => {
        const rawValue = row[col.key];
        return escapeCSV(rawValue);
      })
      .join(",")
  );

  const csvContent = [headerRow, ...dataRows].join("\r\n");

  // UTF-8 BOM (\uFEFF) ensures Excel opens special characters correctly
  const blob = new Blob(["\uFEFF" + csvContent], {
    type: "text/csv;charset=utf-8;",
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);

  const cleanFilename = filename.endsWith(".csv") ? filename : `${filename}.csv`;
  link.setAttribute("download", cleanFilename);
  link.style.visibility = "hidden";

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
