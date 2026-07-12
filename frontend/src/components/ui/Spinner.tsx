import { Loader2 } from "lucide-react";

export function Spinner({ size = 24, className = "" }: { size?: number; className?: string }) {
  return (
    <div className={`flex flex-col items-center justify-center p-12 space-y-4 ${className}`}>
      <Loader2 size={size} className="animate-spin" style={{ color: "var(--accent)" }} />
      <span className="text-[13px] font-medium tracking-wide" style={{ color: "var(--text-secondary)" }}>
        Loading data...
      </span>
    </div>
  );
}
