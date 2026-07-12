import { ReactNode } from "react";

interface Column<T> {
  key: string;
  header: string;
  render?: (row: T) => ReactNode;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  emptyMessage?: string;
}

export function DataTable<T extends Record<string, unknown>>({ columns, data, emptyMessage = "No records found." }: DataTableProps<T>) {
  return (
    <div className="rounded-lg border overflow-hidden" style={{ borderColor: "var(--border)" }}>
      <table className="w-full text-[12px]">
        <thead>
          <tr style={{ background: "var(--bg-elevated)", borderBottom: "1px solid var(--border)" }}>
            {columns.map((col) => (
              <th key={col.key} className="text-left px-3 py-2.5 font-semibold" style={{ color: "var(--text-secondary)" }}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-3 py-8 text-center" style={{ color: "var(--text-muted)" }}>
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row, i) => (
              <tr
                key={i}
                className="border-t transition-colors"
                style={{ borderColor: "var(--border-subtle)", background: i % 2 === 0 ? "var(--bg-surface)" : "var(--bg-base)" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-hover)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = i % 2 === 0 ? "var(--bg-surface)" : "var(--bg-base)")}
              >
                {columns.map((col) => (
                  <td key={col.key} className="px-3 py-2.5" style={{ color: "var(--text-primary)" }}>
                    {col.render ? col.render(row) : String(row[col.key] ?? "—")}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
