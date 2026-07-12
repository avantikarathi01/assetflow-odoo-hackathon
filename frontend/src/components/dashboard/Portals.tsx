import React, { ElementType } from "react";
import Link from "next/link";
import {
  Package, Users, Wrench, CalendarDays, ArrowLeftRight,
  AlertTriangle, TrendingUp, Activity, ChevronRight, Zap,
  Clock, Shield, Building2, UserCircle2, CheckCircle2
} from "lucide-react";

export type DashboardEvent = {
  id: string;
  type: string;
  title: string;
  detail?: string;
  date: string;
};

export type DashboardKpis = {
  totalAssets: number;
  availableAssets: number;
  allocatedAssets: number;
  maintenanceToday: number;
  activeBookings: number;
  pendingTransfers: number;
  overdueReturns?: number;
};

export type RecentActivity = {
  id: string | number;
  action?: string;
  entity: string;
  actor: string;
  time: string;
  status?: string;
};

function dateKey(date: Date | string) {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function formatTime(date: string) {
  return new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" }).format(new Date(date));
}

function KpiCard({ icon: Icon, label, value, color }: { icon: ElementType; label: string; value: string | number; color: string }) {
  const colors: Record<string, string> = {
    teal: "bg-teal-600/10 border-teal-600/20 text-teal-700 dark:text-teal-300",
    green: "bg-emerald-600/10 border-emerald-600/20 text-emerald-700 dark:text-emerald-300",
    indigo: "bg-indigo-600/10 border-indigo-600/20 text-indigo-700 dark:text-indigo-300",
    amber: "bg-amber-500/12 border-amber-600/20 text-amber-700 dark:text-amber-300",
    rose: "bg-rose-600/10 border-rose-600/20 text-rose-700 dark:text-rose-300",
    slate: "bg-slate-600/10 border-slate-600/20 text-slate-700 dark:text-slate-300",
  };
  const c = colors[color] || colors.teal;

  return (
    <div className="glass-card rounded-xl p-5 border transition-all hover:-translate-y-1 hover:shadow-md" style={{ borderColor: "var(--border-subtle)", background: "var(--bg-surface)" }}>
      <div className="flex items-center justify-between mb-4">
        <div className={`p-2.5 rounded-xl border ${c}`}>
          <Icon size={18} />
        </div>
        <TrendingUp size={14} style={{ color: "var(--success)" }} />
      </div>
      <div className="text-3xl font-bold mb-1 tracking-tight" style={{ color: "var(--text-primary)" }}>{value}</div>
      <div className="text-[13px] font-medium" style={{ color: "var(--text-secondary)" }}>{label}</div>
    </div>
  );
}

function QuickAction({ href, icon: Icon, label, color }: { href: string; icon: ElementType; label: string; color: string }) {
  return (
    <Link
      href={href}
      className="glass-card rounded-xl p-4 flex items-center gap-4 group transition-all hover:scale-[1.01] hover:shadow-sm border"
      style={{ borderColor: "var(--border-subtle)", background: "var(--bg-elevated)" }}
    >
      <div className={`p-2.5 rounded-xl ${color}`}>
        <Icon size={18} />
      </div>
      <span className="text-[14px] font-bold transition-colors flex-1" style={{ color: "var(--text-primary)" }}>{label}</span>
      <ChevronRight size={16} style={{ color: "var(--text-muted)" }} className="transition-transform group-hover:translate-x-1" />
    </Link>
  );
}

export function CalendarWidget({ events, selectedDate, setSelectedDate }: { events: DashboardEvent[], selectedDate: string, setSelectedDate: (d: string) => void }) {
  const days = Array.from({ length: 14 }, (_, index) => {
    const day = new Date();
    day.setDate(day.getDate() + index);
    return day;
  });
  const selectedEvents = events.filter((event) => dateKey(event.date) === selectedDate);

  return (
    <div className="glass-card rounded-2xl p-5 border" style={{ borderColor: "var(--border-subtle)", background: "var(--bg-surface)" }}>
      <div className="grid grid-cols-7 gap-2">
        {days.map((day) => {
          const key = dateKey(day);
          const count = events.filter((event) => dateKey(event.date) === key).length;
          const active = selectedDate === key;
          return (
            <button
              key={key}
              onClick={() => setSelectedDate(key)}
              className="h-20 rounded-xl border text-left p-2 transition-all hover:scale-105"
              style={{
                borderColor: active ? "var(--accent)" : "var(--border-subtle)",
                background: active ? "var(--accent-glow)" : "var(--bg-elevated)",
                color: "var(--text-primary)",
              }}
            >
              <div className="text-[10px] uppercase font-bold tracking-wider" style={{ color: "var(--text-muted)" }}>
                {new Intl.DateTimeFormat(undefined, { weekday: "short" }).format(day)}
              </div>
              <div className="text-xl font-bold leading-tight mt-1">{day.getDate()}</div>
              {count > 0 && <div className="mt-1 w-1.5 h-1.5 rounded-full" style={{ background: "var(--accent)" }} />}
            </button>
          );
        })}
      </div>

      <div className="mt-6 border-t pt-5" style={{ borderColor: "var(--border-subtle)" }}>
        <div className="mb-4 text-[13px] font-bold tracking-wider" style={{ color: "var(--text-secondary)" }}>
          {new Intl.DateTimeFormat(undefined, { dateStyle: "full" }).format(new Date(`${selectedDate}T00:00:00`))}
        </div>
        <div className="space-y-3">
          {selectedEvents.length === 0 ? (
            <div className="rounded-xl border border-dashed px-4 py-8 text-center text-[13px] flex flex-col items-center gap-2" style={{ borderColor: "var(--border-subtle)", color: "var(--text-muted)" }}>
              <CalendarDays size={24} style={{ opacity: 0.5 }} />
              <span>No scheduled events for this date.</span>
            </div>
          ) : (
            selectedEvents.map((event) => (
              <div key={event.id} className="rounded-xl border px-4 py-3 flex gap-4 transition-all hover:bg-slate-500/5" style={{ borderColor: "var(--border-subtle)", background: "var(--bg-elevated)" }}>
                <div className="mt-0.5 rounded-lg p-2.5 bg-teal-600/10 text-teal-700 dark:text-teal-300 h-fit">
                  <Clock size={16} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="text-[14px] font-bold" style={{ color: "var(--text-primary)" }}>{event.title}</span>
                    <span className="rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider" style={{ background: "var(--accent-glow)", color: "var(--accent)" }}>{event.type}</span>
                  </div>
                  <div className="text-[13px] font-medium" style={{ color: "var(--text-secondary)" }}>
                    {formatTime(event.date)}{event.detail ? ` • ${event.detail}` : ""}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function ActivityFeed({ activity }: { activity: RecentActivity[] }) {
  return (
    <div className="space-y-3">
      {activity.length === 0 ? (
        <div className="glass rounded-xl p-8 text-center border border-dashed flex flex-col items-center gap-2" style={{ borderColor: "var(--border-subtle)" }}>
          <Activity size={24} style={{ color: "var(--text-muted)" }} />
          <p className="text-[13px] font-medium" style={{ color: "var(--text-muted)" }}>No recent activity to display.</p>
        </div>
      ) : (
        activity.map((a) => (
          <div key={a.id} className="p-4 rounded-xl border transition-all hover:-translate-y-[1px] hover:shadow-sm" style={{ borderColor: "var(--border-subtle)", background: "var(--bg-surface)" }}>
            <div className="flex items-center gap-4 text-[13px]">
              <div className={`w-2.5 h-2.5 rounded-full shrink-0 shadow-sm ${
                a.status === "ALLOCATED" ? "bg-teal-500 shadow-teal-500/40" :
                a.status === "RESOLVED" ? "bg-emerald-500 shadow-emerald-500/40" :
                "bg-amber-500 shadow-amber-500/40"
              }`} />
              <div className="flex-1 min-w-0 font-medium">
                <span style={{ color: "var(--text-primary)" }}>{a.actor}</span>
                <span className="mx-1.5" style={{ color: "var(--text-muted)" }}>•</span>
                <span style={{ color: "var(--text-secondary)" }}>{a.action?.toLowerCase()}</span>
                <span className="ml-1.5 font-bold" style={{ color: "var(--accent)" }}>{a.entity}</span>
              </div>
              <span className="text-[12px] font-medium shrink-0" style={{ color: "var(--text-muted)" }}>{a.time}</span>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

// ---------------------------------------------------------
// 1. ADMIN PORTAL
// ---------------------------------------------------------
export function AdminPortal({ kpis, activity, events, selectedDate, setSelectedDate, loading }: any) {
  const overdueReturns = kpis?.overdueReturns ?? 0;
  return (
    <div className="animate-fade-in">
      {/* Header Profile Badge */}
      <div className="mb-8 flex items-center justify-between p-4 rounded-2xl border" style={{ background: "var(--bg-surface)", borderColor: "var(--border-subtle)" }}>
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20">
            <Shield size={24} className="text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <h2 className="text-[18px] font-bold" style={{ color: "var(--text-primary)" }}>Admin Workspace</h2>
            <p className="text-[13px]" style={{ color: "var(--text-secondary)" }}>Full platform visibility and organization control.</p>
          </div>
        </div>
        <Link href="/dashboard/organization" className="px-4 py-2 rounded-xl text-[13px] font-bold border transition-colors hover:bg-slate-500/10" style={{ borderColor: "var(--border)", color: "var(--text-primary)" }}>
          Manage Organization
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <KpiCard icon={Package} label="Total Assets" value={loading ? "-" : kpis?.totalAssets ?? 0} color="teal" />
        <KpiCard icon={Users} label="Allocated" value={loading ? "-" : kpis?.allocatedAssets ?? 0} color="indigo" />
        <KpiCard icon={Wrench} label="In Maintenance" value={loading ? "-" : kpis?.maintenanceToday ?? 0} color="amber" />
        <KpiCard icon={AlertTriangle} label="Overdue Returns" value={loading ? "-" : overdueReturns} color="rose" />
      </div>

      <div className="grid xl:grid-cols-[1.2fr_1fr] gap-8">
        <div>
          <h2 className="text-[15px] font-bold mb-5 flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
            <Activity size={16} style={{ color: "var(--success)" }} /> System Activity Stream
          </h2>
          <ActivityFeed activity={activity} />
        </div>
        <div>
          <h2 className="text-[15px] font-bold mb-5 flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
            <CalendarDays size={16} style={{ color: "var(--accent)" }} /> Global Schedule
          </h2>
          <CalendarWidget events={events} selectedDate={selectedDate} setSelectedDate={setSelectedDate} />
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------
// 2. MANAGER PORTAL
// ---------------------------------------------------------
export function ManagerPortal({ kpis, activity, events, selectedDate, setSelectedDate, loading }: any) {
  return (
    <div className="animate-fade-in">
      <div className="mb-8 flex items-center justify-between p-4 rounded-2xl border" style={{ background: "var(--bg-surface)", borderColor: "var(--border-subtle)" }}>
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
            <Building2 size={24} className="text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h2 className="text-[18px] font-bold" style={{ color: "var(--text-primary)" }}>Manager Workspace</h2>
            <p className="text-[13px]" style={{ color: "var(--text-secondary)" }}>Department approvals, transfers, and resource scheduling.</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        <KpiCard icon={Package} label="Available Assets" value={loading ? "-" : kpis?.availableAssets ?? 0} color="green" />
        <KpiCard icon={CalendarDays} label="Active Bookings" value={loading ? "-" : kpis?.activeBookings ?? 0} color="slate" />
        <KpiCard icon={ArrowLeftRight} label="Pending Transfers" value={loading ? "-" : kpis?.pendingTransfers ?? 0} color="rose" />
      </div>

      <div className="grid xl:grid-cols-[1fr_1.1fr] gap-8">
        <div>
          <h2 className="text-[15px] font-bold mb-5 flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
            <Zap size={16} style={{ color: "var(--accent)" }} /> Quick Actions
          </h2>
          <div className="space-y-3 mb-8">
            <QuickAction href="/dashboard/assets" icon={Package} label="Register Department Asset" color="bg-teal-600/10 text-teal-700 dark:text-teal-300" />
            <QuickAction href="/dashboard/allocations" icon={ArrowLeftRight} label="Review Transfer Requests" color="bg-rose-600/10 text-rose-700 dark:text-rose-300" />
            <QuickAction href="/dashboard/maintenance" icon={Wrench} label="Approve Maintenance" color="bg-amber-500/10 text-amber-700 dark:text-amber-300" />
          </div>
          <h2 className="text-[15px] font-bold mb-5 flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
            <Activity size={16} style={{ color: "var(--success)" }} /> Recent Approvals
          </h2>
          <ActivityFeed activity={activity} />
        </div>
        <div>
          <h2 className="text-[15px] font-bold mb-5 flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
            <CalendarDays size={16} style={{ color: "var(--accent)" }} /> Department Calendar
          </h2>
          <CalendarWidget events={events} selectedDate={selectedDate} setSelectedDate={setSelectedDate} />
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------
// 3. EMPLOYEE PORTAL
// ---------------------------------------------------------
export function EmployeePortal({ events, selectedDate, setSelectedDate }: any) {
  return (
    <div className="animate-fade-in">
      <div className="mb-8 flex items-center justify-between p-4 rounded-2xl border" style={{ background: "var(--bg-surface)", borderColor: "var(--border-subtle)" }}>
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-teal-500/10 border border-teal-500/20">
            <UserCircle2 size={24} className="text-teal-600 dark:text-teal-400" />
          </div>
          <div>
            <h2 className="text-[18px] font-bold" style={{ color: "var(--text-primary)" }}>My Workspace</h2>
            <p className="text-[13px]" style={{ color: "var(--text-secondary)" }}>Manage your assigned assets and upcoming bookings.</p>
          </div>
        </div>
      </div>

      <div className="grid xl:grid-cols-2 gap-8">
        <div>
          <div className="grid grid-cols-2 gap-4 mb-6">
            <Link href="/dashboard/allocations" className="glass-card rounded-2xl p-6 border text-center transition-all hover:-translate-y-1 hover:shadow-md group" style={{ borderColor: "var(--border-subtle)", background: "var(--bg-surface)" }}>
              <Package size={28} className="mx-auto mb-3 transition-transform group-hover:scale-110" style={{ color: "var(--accent)" }} />
              <h3 className="text-[16px] font-bold" style={{ color: "var(--text-primary)" }}>My Assets</h3>
              <p className="text-[12px] mt-1" style={{ color: "var(--text-secondary)" }}>View assigned equipment</p>
            </Link>
            <Link href="/dashboard/maintenance" className="glass-card rounded-2xl p-6 border text-center transition-all hover:-translate-y-1 hover:shadow-md group" style={{ borderColor: "var(--border-subtle)", background: "var(--bg-surface)" }}>
              <Wrench size={28} className="mx-auto mb-3 transition-transform group-hover:scale-110" style={{ color: "var(--warning)" }} />
              <h3 className="text-[16px] font-bold" style={{ color: "var(--text-primary)" }}>Report Issue</h3>
              <p className="text-[12px] mt-1" style={{ color: "var(--text-secondary)" }}>Raise a maintenance ticket</p>
            </Link>
          </div>
          
          <h2 className="text-[15px] font-bold mb-4 flex items-center gap-2 mt-8" style={{ color: "var(--text-primary)" }}>
            <Zap size={16} style={{ color: "var(--accent)" }} /> Self Service
          </h2>
          <div className="space-y-3">
            <QuickAction href="/dashboard/bookings" icon={CalendarDays} label="Book a Resource (Room/Vehicle)" color="bg-indigo-600/10 text-indigo-700 dark:text-indigo-300" />
            <QuickAction href="/dashboard/allocations" icon={ArrowLeftRight} label="Request an Asset Transfer" color="bg-rose-600/10 text-rose-700 dark:text-rose-300" />
          </div>
        </div>
        
        <div>
          <h2 className="text-[15px] font-bold mb-4 flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
            <CalendarDays size={16} style={{ color: "var(--accent)" }} /> My Schedule
          </h2>
          <CalendarWidget events={events} selectedDate={selectedDate} setSelectedDate={setSelectedDate} />
        </div>
      </div>
    </div>
  );
}
