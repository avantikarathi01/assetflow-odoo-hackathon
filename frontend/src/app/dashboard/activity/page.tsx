"use client";
import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { Spinner } from "@/components/ui/Spinner";
import { Activity, Bell, AlertCircle, CheckCircle2 } from "lucide-react";

export default function ActivityPage() {
  const [tab, setTab] = useState<"activity" | "alerts">("activity");
  const [activities, setActivities] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      apiFetch("/dashboard"),
      apiFetch("/notifications")
    ]).then(([dashData, notifs]) => {
      setActivities(dashData.recentActivity || []);
      setNotifications(notifs || []);
      setLoading(false);
    }).catch(console.error);
  }, []);

  const TAB_CLS = (t: string) =>
    `px-4 py-2 rounded-xl text-[13px] font-bold border transition-all ${tab === t ? "border-[var(--accent)] text-[var(--accent)] bg-[var(--accent-glow)]" : "border-transparent text-[var(--text-secondary)] hover:bg-slate-500/10"}`;

  return (
    <div className="animate-fade-in max-w-4xl">
      <PageHeader
        title="Activity Logs & Notifications"
        subtitle="Track system events, user actions, and automated alerts."
      />

      <div className="flex gap-2 mb-6">
        <button className={TAB_CLS("activity")} onClick={() => setTab("activity")}>
          <Activity size={14} className="inline mr-2" />All Activity
        </button>
        <button className={TAB_CLS("alerts")} onClick={() => setTab("alerts")}>
          <Bell size={14} className="inline mr-2" />Alerts
        </button>
      </div>

      {tab === "activity" && (
        <div className="space-y-3">
          {loading ? (
            <Spinner />
          ) : activities.length === 0 ? (
            <EmptyState
              icon={Activity}
              title="No Recent Activity"
              description="User actions, allocation changes, maintenance updates, and audit events will show up here in real time."
            />
          ) : (
            activities.map(a => (
              <div key={a.id} className="p-4 rounded-xl border transition-all hover:-translate-y-[1px] hover:shadow-sm" style={{ borderColor: "var(--border-subtle)", background: "var(--bg-surface)" }}>
                <div className="flex gap-4 text-[13px] items-center">
                  <div className={`p-2.5 rounded-xl shrink-0 ${
                    a.status === "ALLOCATED" ? "bg-blue-500/10 text-blue-600 dark:text-blue-400" :
                    a.status === "RESOLVED" ? "bg-green-500/10 text-green-600 dark:text-green-400" :
                    "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                  }`}>
                    <Activity size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="font-bold" style={{ color: "var(--text-primary)" }}>{a.actor}</span>
                    <span className="mx-1.5" style={{ color: "var(--text-muted)" }}>•</span>
                    <span style={{ color: "var(--text-secondary)" }}>{a.action?.toLowerCase()}</span>
                    <span className="ml-1.5 font-bold" style={{ color: "var(--accent)" }}>{a.entity}</span>
                  </div>
                  <span className="text-[12px] shrink-0 font-medium" style={{ color: "var(--text-muted)" }}>{a.time}</span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {tab === "alerts" && (
        <div className="space-y-3">
          {loading ? (
            <Spinner />
          ) : notifications.length === 0 ? (
            <EmptyState
              icon={CheckCircle2}
              title="System Healthy"
              description="No active alerts. All systems are operating normally. Critical alerts like overdue returns or maintenance escalations will appear here."
            />
          ) : (
            notifications.map(n => (
              <div key={n.id} className="p-4 rounded-xl border transition-all hover:-translate-y-[1px] hover:shadow-sm" style={{ borderColor: "var(--border-subtle)", background: "var(--bg-surface)" }}>
                <div className="flex gap-4 items-center">
                  <div className={`p-2.5 rounded-xl shrink-0 ${
                    n.severity === 'SUCCESS' ? 'bg-green-500/10 text-green-500' :
                    n.severity === 'WARNING' ? 'bg-amber-500/10 text-amber-500' :
                    n.severity === 'ERROR' ? 'bg-red-500/10 text-red-500' :
                    'bg-blue-500/10 text-blue-500'
                  }`}>
                    {n.severity === 'WARNING' ? <AlertCircle size={18} /> : 
                     n.severity === 'SUCCESS' ? <CheckCircle2 size={18} /> : 
                     <Bell size={18} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-[14px]" style={{ color: "var(--text-primary)" }}>{n.title}</p>
                    <p className="text-[13px] mt-0.5" style={{ color: "var(--text-secondary)" }}>{n.message}</p>
                  </div>
                  <span className="text-[12px] shrink-0 font-medium" style={{ color: "var(--text-muted)" }}>
                    {new Date(n.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
