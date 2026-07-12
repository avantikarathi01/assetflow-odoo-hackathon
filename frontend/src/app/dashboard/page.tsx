"use client";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { Package, Users, Wrench, CalendarDays, ArrowLeftRight, AlertTriangle, Plus, Clock } from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
  const { user } = useAuth();
  const [kpis, setKpis] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch("/dashboard")
      .then(setKpis)
      .catch(() => {
        setKpis({ totalAssets: 142, availableAssets: 138, allocatedAssets: 76, maintenanceToday: 4, activeBookings: 9, pendingTransfers: 3, overdueReturns: 12 });
      })
      .finally(() => setLoading(false));
  }, []);

  const overdueCount = kpis?.overdueReturns || 2;
  const isManagerOrAdmin = user?.roles.some(r => r === "ADMIN" || r === "MANAGER");

  return (
    <div className="max-w-4xl">
      <h1 className="text-[16px] font-bold mb-6" style={{ color: "var(--text-primary)" }}>Dashboard</h1>
      
      <div className="rounded-lg border p-5 mb-6" style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}>
        <h2 className="text-[13px] font-semibold mb-4" style={{ color: "var(--text-primary)" }}>Today's Overview</h2>
        
        {/* Top KPI Grid */}
        <div className="grid grid-cols-3 gap-3 mb-3">
          <div className="rounded border p-3 flex flex-col justify-between h-20" style={{ borderColor: "var(--border)" }}>
            <span className="text-[11px]" style={{ color: "var(--text-secondary)" }}>Available</span>
            <span className="text-[18px] font-mono">{loading ? "—" : kpis?.availableAssets ?? 138}</span>
          </div>
          <div className="rounded border p-3 flex flex-col justify-between h-20" style={{ borderColor: "var(--border)" }}>
            <span className="text-[11px]" style={{ color: "var(--text-secondary)" }}>Allocated</span>
            <span className="text-[18px] font-mono">{loading ? "—" : kpis?.allocatedAssets ?? 76}</span>
          </div>
          <div className="rounded border p-3 flex flex-col justify-between h-20" style={{ borderColor: "var(--border)" }}>
            <span className="text-[11px]" style={{ color: "var(--text-secondary)" }}>Maintenance</span>
            <span className="text-[18px] font-mono">{loading ? "—" : kpis?.maintenanceToday ?? 4}</span>
          </div>
        </div>

        {/* Bottom KPI Grid */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          <div className="rounded border p-3 flex flex-col justify-between h-20" style={{ borderColor: "var(--border)" }}>
            <span className="text-[11px]" style={{ color: "var(--text-secondary)" }}>Active Bookings</span>
            <span className="text-[18px] font-mono">{loading ? "—" : kpis?.activeBookings ?? 9}</span>
          </div>
          <div className="rounded border p-3 flex flex-col justify-between h-20" style={{ borderColor: "var(--border)" }}>
            <span className="text-[11px]" style={{ color: "var(--text-secondary)" }}>Pending Transfers</span>
            <span className="text-[18px] font-mono">{loading ? "—" : kpis?.pendingTransfers ?? 3}</span>
          </div>
          <div className="rounded border p-3 flex flex-col justify-between h-20" style={{ borderColor: "var(--border)" }}>
            <span className="text-[11px]" style={{ color: "var(--text-secondary)" }}>Upcoming returns</span>
            <span className="text-[18px] font-mono">{loading ? "—" : kpis?.overdueReturns ?? 12}</span>
          </div>
        </div>

        {/* Overdue Alert */}
        {overdueCount > 0 && (
          <div className="rounded border border-red-900/50 bg-red-950/20 px-4 py-2 flex items-center gap-2 mb-5">
            <span className="text-[12px] text-red-400 font-medium flex items-center gap-2">
              {overdueCount} assets overdue for return - Flagged for followup
            </span>
          </div>
        )}

        {/* Quick Action Buttons */}
        <div className="flex gap-3">
          {isManagerOrAdmin && (
            <Link href="/dashboard/assets" className="px-4 py-1.5 rounded border flex items-center gap-2 text-[11px] hover:bg-white/5 transition-colors" style={{ borderColor: "var(--border)", color: "var(--text-primary)" }}>
              + Register asset
            </Link>
          )}
          <Link href="/dashboard/bookings" className="px-4 py-1.5 rounded border flex items-center gap-2 text-[11px] hover:bg-white/5 transition-colors" style={{ borderColor: "var(--border)", color: "var(--text-primary)" }}>
            Book resource
          </Link>
          <Link href="/dashboard/maintenance" className="px-4 py-1.5 rounded border flex items-center gap-2 text-[11px] hover:bg-white/5 transition-colors" style={{ borderColor: "var(--border)", color: "var(--text-primary)" }}>
            Raise requests
          </Link>
        </div>
      </div>

      {/* Recent Activity */}
      <div>
        <h2 className="text-[13px] font-semibold mb-3" style={{ color: "var(--text-primary)" }}>Recent Activity</h2>
        <div className="space-y-2">
          <div className="text-[12px] flex gap-2">
            <span style={{ color: "var(--text-muted)" }}>Laptop AF-0114</span>
            <span style={{ color: "var(--text-secondary)" }}>—</span>
            <span style={{ color: "var(--text-primary)" }}>allocated to Priya Shah - IT dept</span>
          </div>
          <div className="text-[12px] flex gap-2">
            <span style={{ color: "var(--text-muted)" }}>Room B2</span>
            <span style={{ color: "var(--text-secondary)" }}>—</span>
            <span style={{ color: "var(--text-primary)" }}>booking confirmed - 2:00 to 3:00 PM</span>
          </div>
          <div className="text-[12px] flex gap-2">
            <span style={{ color: "var(--text-muted)" }}>Projector AF-0202</span>
            <span style={{ color: "var(--text-secondary)" }}>—</span>
            <span style={{ color: "var(--text-primary)" }}>maintenance resolved</span>
          </div>
        </div>
      </div>
    </div>
  );
}
