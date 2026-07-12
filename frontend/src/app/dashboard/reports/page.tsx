"use client";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { KpiCard } from "@/components/ui/KpiCard";
import { apiFetch } from "@/lib/api";
import { BarChart2, TrendingUp, Package, Wrench } from "lucide-react";

// TODO: map to backend API — utilization report
const MOCK_TOP_ASSETS = [
  { name: "Dell XPS 15",     tag: "AST-001", count: 12, dept: "Engineering" },
  { name: "MacBook Pro M3",  tag: "AST-005", count: 9,  dept: "Design" },
  { name: "iPad Pro",        tag: "AST-009", count: 7,  dept: "Sales" },
  { name: "Epson Projector", tag: "AST-007", count: 6,  dept: "Operations" },
  { name: "iPhone 14 Pro",   tag: "AST-002", count: 5,  dept: "Sales" },
];

const MOCK_STATUS_DIST = [
  { status: "AVAILABLE",        count: 87, color: "#10b981" },
  { status: "ALLOCATED",        count: 43, color: "#3b82f6" },
  { status: "UNDER_MAINTENANCE",count: 6,  color: "#f59e0b" },
  { status: "RESERVED",         count: 4,  color: "#8b5cf6" },
  { status: "RETIRED",          count: 2,  color: "#6b7280" },
];

const MOCK_DEPT_DIST = [
  { dept: "Engineering", count: 38 },
  { dept: "Operations",  count: 27 },
  { dept: "Sales",       count: 22 },
  { dept: "Design",      count: 18 },
  { dept: "Finance",     count: 15 },
  { dept: "HR",          count: 12 },
  { dept: "IT",          count: 10 },
];

const total = MOCK_STATUS_DIST.reduce((s, d) => s + d.count, 0);
const deptMax = Math.max(...MOCK_DEPT_DIST.map((d) => d.count));

export default function ReportsPage() {
  const [utilization, setUtilization] = useState<{ mostUsed: { name: string; tag: string; allocationCount: number }[] } | null>(null);

  useEffect(() => {
    apiFetch("/dashboard/utilization")
      .then(setUtilization)
      .catch(() => setUtilization({ mostUsed: MOCK_TOP_ASSETS.map((a) => ({ name: a.name, tag: a.tag, allocationCount: a.count })) }));
  }, []);

  return (
    <div>
      <PageHeader title="Reports & Analytics" subtitle="Asset utilization and operational metrics" />

      {/* Summary KPIs */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        <KpiCard label="Total Assets"    value={total}  icon={<Package size={15} />}   accent="blue"  />
        <KpiCard label="Utilization Rate" value="30.3%" icon={<TrendingUp size={15} />} accent="green" sub="Allocated / Total" />
        <KpiCard label="Avg Allocations" value="4.2"   icon={<BarChart2 size={15} />}  accent="violet" sub="Per asset / month" />
        <KpiCard label="Maintenance Rate" value="4.2%" icon={<Wrench size={15} />}     accent="amber" sub="Assets in repair" />
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        {/* Status Distribution */}
        <div className="rounded-lg border p-4" style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}>
          <h2 className="text-[12px] font-semibold mb-4" style={{ color: "var(--text-primary)" }}>Asset Status Distribution</h2>
          <div className="space-y-2.5">
            {MOCK_STATUS_DIST.map((d) => (
              <div key={d.status}>
                <div className="flex justify-between mb-1">
                  <span className="text-[11px]" style={{ color: "var(--text-secondary)" }}>{d.status.replace("_", " ")}</span>
                  <span className="text-[11px] font-medium" style={{ color: "var(--text-primary)" }}>{d.count} ({Math.round((d.count / total) * 100)}%)</span>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--bg-elevated)" }}>
                  <div className="h-full rounded-full transition-all" style={{ width: `${(d.count / total) * 100}%`, background: d.color }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Department Distribution */}
        <div className="rounded-lg border p-4" style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}>
          <h2 className="text-[12px] font-semibold mb-4" style={{ color: "var(--text-primary)" }}>Assets by Department</h2>
          <div className="space-y-2.5">
            {MOCK_DEPT_DIST.map((d) => (
              <div key={d.dept}>
                <div className="flex justify-between mb-1">
                  <span className="text-[11px]" style={{ color: "var(--text-secondary)" }}>{d.dept}</span>
                  <span className="text-[11px] font-medium" style={{ color: "var(--text-primary)" }}>{d.count}</span>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--bg-elevated)" }}>
                  <div className="h-full rounded-full bg-blue-500 transition-all" style={{ width: `${(d.count / deptMax) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Most Allocated Assets */}
      <div className="rounded-lg border" style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}>
        <div className="px-4 py-3 border-b" style={{ borderColor: "var(--border)" }}>
          <h2 className="text-[12px] font-semibold" style={{ color: "var(--text-primary)" }}>Most Allocated Assets</h2>
        </div>
        <table className="w-full text-[12px]">
          <thead>
            <tr style={{ background: "var(--bg-elevated)", borderBottom: "1px solid var(--border)" }}>
              {["Rank", "Asset", "Tag", "Department", "Allocation Count", "Utilization"].map((h) => (
                <th key={h} className="text-left px-3 py-2.5 font-semibold" style={{ color: "var(--text-secondary)" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {MOCK_TOP_ASSETS.map((a, i) => (
              <tr key={a.tag} className="border-t" style={{ borderColor: "var(--border-subtle)", background: i % 2 === 0 ? "var(--bg-surface)" : "var(--bg-base)" }}>
                <td className="px-3 py-2.5 font-bold text-[11px]" style={{ color: "var(--text-muted)" }}>#{i + 1}</td>
                <td className="px-3 py-2.5 font-medium" style={{ color: "var(--text-primary)" }}>{a.name}</td>
                <td className="px-3 py-2.5 font-mono text-[11px]" style={{ color: "var(--text-muted)" }}>{a.tag}</td>
                <td className="px-3 py-2.5" style={{ color: "var(--text-secondary)" }}>{a.dept}</td>
                <td className="px-3 py-2.5 font-medium" style={{ color: "var(--text-primary)" }}>{a.count}</td>
                <td className="px-3 py-2.5 w-32">
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--bg-elevated)" }}>
                    <div className="h-full rounded-full bg-blue-500" style={{ width: `${(a.count / 12) * 100}%` }} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
