import { ReactNode } from "react";
import { Search } from "lucide-react";

interface FilterBarProps {
  search: string;
  onSearch: (v: string) => void;
  placeholder?: string;
  children?: ReactNode;
}

export function FilterBar({ search, onSearch, placeholder = "Search...", children }: FilterBarProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-3 mb-6 p-3 glass-card rounded-xl">
      <div className="relative flex-1">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
        <input
          type="text"
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          placeholder={placeholder}
          className="w-full pl-10 pr-4 py-2 bg-black/20 border border-[rgba(255,255,255,0.05)] rounded-lg text-[13px] text-white placeholder-slate-500 outline-none transition-all focus:border-blue-500 focus:bg-black/40"
        />
      </div>
      {children && <div className="flex items-center gap-3">{children}</div>}
    </div>
  );
}

export function Select({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="px-4 py-2 rounded-lg border text-[13px] outline-none transition-all focus:border-blue-500 appearance-none cursor-pointer"
      style={{ background: "rgba(0,0,0,0.2)", borderColor: "rgba(255,255,255,0.05)", color: "var(--text-primary)" }}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value} className="bg-[#0f1117] text-slate-300">{o.label}</option>
      ))}
    </select>
  );
}
