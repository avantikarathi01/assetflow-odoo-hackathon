"use client";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { KpiCard } from "@/components/ui/KpiCard";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Package, Users, Wrench, CalendarDays, ArrowLeftRight, AlertTriangle, Activity } from "lucide-react";

interface KPIs {
  totalAssets: number;
  availableAssets: number;
  allocatedAssets: number;
  maintenanceToday: number;
  activeBookings: number;
  pendingTransfers: number;
  overdueReturns: number;
}

// TODO: map to backend API — recent activity feed
const MOCK_ACTIVITY = [
  { id: 1, action: "ALLOCATED",  entity: "Laptop Dell XPS 15",   actor: "John Doe",    time: "2 min ago",  status: "ALLOCATED" },
  { id: 2, action: "REQUESTED",  entity: "Transfer #TRF-004",     actor: "Sarah Kim",   time: "15 min ago", status: "REQUESTED" },
  { id: 3, action: "RESOLVED",   entity: "Maintenance #MNT-012",  actor: "Tech Team",   time: "1 hr ago",   status: "RESOLVED" },
  { id: 4, action: "CONFIRMED",  entity: "Conf Room A — 2pm",     actor: "Mike Chen",   time: "2 hr ago",   status: "CONFIRMED" },
  { id: 5, action: "RETURNED",   entity: "iPad Pro #AST-089",     actor: "Lisa Park",   time: "3 hr ago",   status: "RETURNED" },
];

export default function DashboardPage() {
  const [kpis, setKpis] = useState<KPIs | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch("/dashboard")
      .then(setKpis)
      .catch(() => {
        // TODO: map to backend API — fallback mock
        setKpis({ totalAssets: 142, availableAssets: 87, allocatedAssets: 43, maintenanceToday: 6, activeBookings: 4, pendingTransfers: 8, overdueReturns: 3 });
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle="Real-time operational overview"
        actions={
          <span className="flex items-center gap-1.5 text-[11px] px-2 py-1 rounded border" style={{ color: "var(--text-secondary)", borderColor: "var(--border)" }}>
            <Activity size={11} className="text-emerald-400" />
            Live
          </span>
        }
      />

      {/* KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <KpiCard label="Total Assets"      value={loading ? "—" : kpis?.totalAssets ?? 0}      icon={<Package size={15} />}       accent="blue"   />
        <KpiCard label="Available"         value={loading ? "—" : kpis?.availableAssets ?? 0}   icon={<Package size={15} />}       accent="green"  />
        <KpiCard label="Allocated"         value={loading ? "—" : kpis?.allocatedAssets ?? 0}   icon={<Users size={15} />}         accent="violet" />
        <KpiCard label="Overdue Returns"   value={loading ? "—" : kpis?.overdueReturns ?? 0}    icon={<AlertTriangle size={15} />} accent="red"    sub="Needs attention" />
        <KpiCard label="Active Bookings"   value={loading ? "—" : kpis?.activeBookings ?? 0}    icon={<CalendarDays size={15} />}  accent="blue"   />
        <KpiCard label="Pending Transfers" value={loading ? "—" : kpis?.pendingTransfers ?? 0}  icon={<ArrowLeftRight size={15} />} accent="amber" />
        <KpiCard label="In Maintenance"    value={loading ? "—" : kpis?.maintenanceToday ?? 0}  icon={<Wrench size={15} />}        accent="amber"  />
        <KpiCard label="Utilization"       value={loading || !kpis ? "—" : `${Math.round((kpis.allocatedAssets / Math.max(kpis.totalAssets, 1)) * 100)}%`} icon={<Activity size={15} />} accent="green" sub="Allocated / Total" />
      </div>

      {/* Recent Activity */}
      <div className="rounded-lg border" style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}>
        <div className="px-4 py-3 border-b flex items-center justify-between" style={{ borderColor: "var(--border)" }}>
          <h2 className="text-[12px] font-semibold" style={{ color: "var(--text-primary)" }}>Recent Activity</h2>
          <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>Last 24 hours</span>
        </div>
        <div className="divide-y" style={{ borderColor: "var(--border-subtle)" }}>
          {MOCK_ACTIVITY.map((item) => (
            <div key={item.id} className="flex items-center justify-between px-4 py-2.5">
              <div className="flex items-center gap-3">
                <StatusBadge status={item.status} />
                <div>
                  <p className="text-[12px]" style={{ color: "var(--text-primary)" }}>{item.entity}</p>
                  <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>by {item.actor}</p>
                </div>
              </div>
              <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>{item.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
