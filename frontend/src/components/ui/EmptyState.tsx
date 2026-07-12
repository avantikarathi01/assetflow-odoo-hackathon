import { ElementType } from "react";

interface EmptyStateProps {
  icon: ElementType;
  title: string;
  description: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center border border-dashed rounded-2xl glass-card transition-all" style={{ borderColor: "var(--border)", background: "var(--bg-surface)" }}>
      <div className="w-16 h-16 mb-5 rounded-full flex items-center justify-center" style={{ background: "var(--accent-glow)", color: "var(--accent)" }}>
        <Icon size={32} />
      </div>
      <h3 className="text-[16px] font-bold mb-2 tracking-tight" style={{ color: "var(--text-primary)" }}>
        {title}
      </h3>
      <p className="text-[13px] max-w-sm mb-6 leading-relaxed" style={{ color: "var(--text-secondary)" }}>
        {description}
      </p>
      {action && <div>{action}</div>}
    </div>
  );
}
