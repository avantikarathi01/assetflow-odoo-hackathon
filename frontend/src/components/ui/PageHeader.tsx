import { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}

export function PageHeader({ title, subtitle, actions }: PageHeaderProps) {
  return (
    <div className="flex items-start justify-between mb-8 pb-4 border-b border-[rgba(255,255,255,0.05)]">
      <div>
        <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent drop-shadow-sm">{title}</h1>
        {subtitle && <p className="text-[13px] mt-1.5 font-medium" style={{ color: "var(--text-secondary)" }}>{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-3">{actions}</div>}
    </div>
  );
}
