/**
 * Export an array of objects to a CSV file and trigger download.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function exportToCsv<T extends Record<string, any>>(
  filename: string,
  data: T[],
  columns: { key: string; header: string; render?: (item: T) => string }[],
) {
  if (data.length === 0) return;

  const headers = columns.map((c) => c.header);
  const rows = data.map((item) =>
    columns.map((col) => {
      const val = col.render ? col.render(item) : item[col.key];
      if (val === null || val === undefined) return "";
      const str = String(val);
      // Escape quotes and wrap if contains comma/newline/quote
      if (str.includes(",") || str.includes("\n") || str.includes('"')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    }),
  );

  const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = `${filename}-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}
