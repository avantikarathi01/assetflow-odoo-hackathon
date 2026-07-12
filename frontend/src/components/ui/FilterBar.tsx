import { ReactNode } from "react";
import { Search } from "lucide-react";

interface FilterBarProps {
  search: string;
  onSearch: (v: string) => void;
  placeholder?: string;
  children?: ReactNode;
}

export function FilterBar({ search, onSearch, placeholder = "Search…", children }: FilterBarProps) {
  return (
    <div className="flex items-center gap-2 mb-4 flex-wrap">
      <div className="relative">
        <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: "var(--text-muted)" }} />
        <input
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          placeholder={placeholder}
          className="pl-8 pr-3 py-1.5 rounded border text-[12px] outline-none focus:border-blue-600 w-56"
          style={{ background: "var(--bg-elevated)", borderColor: "var(--border)", color: "var(--text-primary)" }}
        />
      </div>
      {children}
    </div>
  );
}

export function Select({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: { label: string; value: string }[] }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="px-2.5 py-1.5 rounded border text-[12px] outline-none focus:border-blue-600"
      style={{ background: "var(--bg-elevated)", borderColor: "var(--border)", color: "var(--text-primary)" }}
    >
      {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}
