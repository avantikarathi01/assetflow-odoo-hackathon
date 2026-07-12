"use client";
import { useState, useEffect, useMemo } from "react";
import { apiFetch } from "@/lib/api";
import { PageHeader } from "@/components/ui/PageHeader";
import { Btn } from "@/components/ui/Modal";
import { EmptyState } from "@/components/ui/EmptyState";
import { Spinner } from "@/components/ui/Spinner";
import { Download, TrendingDown, PieChart, AlertCircle, BarChart3 } from "lucide-react";

export default function ReportsPage() {
  const [tab, setTab] = useState<"overview" | "depreciation" | "utilization" | "compliance">("depreciation");
  const [assets, setAssets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch("/assets").then(data => {
      setAssets(data);
      setLoading(false);
    }).catch(console.error);
  }, []);

  const depreciationData = useMemo(() => {
    const data: Record<string, { count: number, original: number, current: number }> = {};
    assets.forEach(a => {
      const cat = a.category?.name || "Uncategorized";
      if (!data[cat]) data[cat] = { count: 0, original: 0, current: 0 };
      
      const cost = parseFloat(a.purchaseCost) || 0;
      // Simple mockup depreciation based on condition
      let currentVal = cost;
      if (a.condition === 'EXCELLENT') currentVal *= 0.9;
      if (a.condition === 'GOOD') currentVal *= 0.7;
      if (a.condition === 'FAIR') currentVal *= 0.4;
      if (a.condition === 'POOR') currentVal *= 0.1;

      data[cat].count += 1;
      data[cat].original += cost;
      data[cat].current += currentVal;
    });
    return Object.entries(data).map(([cat, stats]) => ({ category: cat, ...stats }));
  }, [assets]);

  return (
    <div className="animate-fade-in max-w-5xl">
      <PageHeader 
        title="Reports & Analytics" 
        subtitle="Generate insights into asset depreciation, utilization, and compliance."
        actions={
          <Btn variant="primary">
            <Download size={14} className="inline mr-2" /> Export Report
          </Btn>
        }
      />

      <div className="flex gap-2 mb-6">
        <button
          className={`px-4 py-2 rounded-xl text-[13px] font-bold transition-all border ${tab === "overview" ? "border-[var(--accent)] text-[var(--accent)] bg-[var(--accent-glow)]" : "border-transparent text-[var(--text-secondary)] hover:bg-slate-500/10"}`}
          onClick={() => setTab("overview")}
        >
          <PieChart size={14} className="inline mr-2" />Overview
        </button>
        <button
          className={`px-4 py-2 rounded-xl text-[13px] font-bold transition-all border ${tab === "depreciation" ? "border-[var(--accent)] text-[var(--accent)] bg-[var(--accent-glow)]" : "border-transparent text-[var(--text-secondary)] hover:bg-slate-500/10"}`}
          onClick={() => setTab("depreciation")}
        >
          <TrendingDown size={14} className="inline mr-2" />Depreciation
        </button>
        <button
          className={`px-4 py-2 rounded-xl text-[13px] font-bold transition-all border ${tab === "utilization" ? "border-[var(--accent)] text-[var(--accent)] bg-[var(--accent-glow)]" : "border-transparent text-[var(--text-secondary)] hover:bg-slate-500/10"}`}
          onClick={() => setTab("utilization")}
        >
          <AlertCircle size={14} className="inline mr-2" />Compliance
        </button>
      </div>

      {tab === "depreciation" && (
        <div className="glass-card rounded-xl p-6">
          <h2 className="text-[16px] font-semibold mb-6 tracking-wide" style={{ color: "var(--text-primary)" }}>Depreciation Report by Category</h2>
          
          <div className="rounded-xl border overflow-hidden border-[rgba(255,255,255,0.05)]">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b" style={{ borderColor: "var(--border-subtle)", background: "rgba(255,255,255,0.02)" }}>
                  <th className="text-left px-5 py-4 font-medium" style={{ color: "var(--text-secondary)" }}>Category</th>
                  <th className="text-left px-5 py-4 font-medium" style={{ color: "var(--text-secondary)" }}>Asset Count</th>
                  <th className="text-left px-5 py-4 font-medium" style={{ color: "var(--text-secondary)" }}>Original Value</th>
                  <th className="text-left px-5 py-4 font-medium" style={{ color: "var(--text-secondary)" }}>Current Est. Value</th>
                  <th className="text-left px-5 py-4 font-medium" style={{ color: "var(--text-secondary)" }}>Value Loss</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                   <tr><td colSpan={5} className="px-5 py-8"><Spinner /></td></tr>
                ) : depreciationData.length === 0 ? (
                   <tr><td colSpan={5} className="px-5 py-8 text-center text-slate-500">No assets available to calculate depreciation.</td></tr>
                ) : (
                  depreciationData.map((d, i) => (
                    <tr key={i} className="border-b transition-colors hover:bg-white/5 border-[rgba(255,255,255,0.05)]">
                      <td className="px-5 py-4 font-medium text-blue-400">{d.category}</td>
                      <td className="px-5 py-4 text-slate-300">{d.count}</td>
                      <td className="px-5 py-4 text-slate-300">${d.original.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                      <td className="px-5 py-4 font-medium text-white">${d.current.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                      <td className="px-5 py-4 text-red-400 font-medium">
                        -${(d.original - d.current).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      {tab !== "depreciation" && (
        <EmptyState
          icon={BarChart3}
          title="Report Coming Soon"
          description="This analytics module is planned for the next release. The Depreciation report is available now."
        />
      )}
    </div>
  );
}
