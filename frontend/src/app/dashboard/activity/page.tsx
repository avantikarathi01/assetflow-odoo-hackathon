"use client";
import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";
import { PageHeader } from "@/components/ui/PageHeader";
import { Activity, Bell, AlertCircle } from "lucide-react";

export default function ActivityPage() {
  const [tab, setTab] = useState<"activity" | "alerts">("activity");
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch("/dashboard").then(data => {
      setActivities(data.recentActivity || []);
      setLoading(false);
    }).catch(console.error);
  }, []);

  return (
    <div className="animate-fade-in max-w-4xl">
      <PageHeader 
        title="Activity Logs & Notifications" 
        subtitle="Track system events, user actions, and automated alerts."
      />

      <div className="flex justify-between items-center mb-6 border-b border-[rgba(255,255,255,0.05)]">
        <div className="flex gap-4">
          <button 
            className={`px-4 py-2 text-[13px] tracking-wide transition-all ${tab === "activity" ? "border-b-2 border-blue-500 font-medium text-blue-400" : "border-b-2 border-transparent text-slate-500 hover:text-slate-300"}`}
            onClick={() => setTab("activity")}
          >
            <Activity size={14} className="inline mr-2" /> All Activity
          </button>
          <button 
            className={`px-4 py-2 text-[13px] tracking-wide transition-all ${tab === "alerts" ? "border-b-2 border-blue-500 font-medium text-blue-400" : "border-b-2 border-transparent text-slate-500 hover:text-slate-300"}`}
            onClick={() => setTab("alerts")}
          >
             <Bell size={14} className="inline mr-2" /> Alerts
          </button>
        </div>
      </div>

      {tab === "activity" && (
        <div className="space-y-3">
          {loading ? (
             <div className="p-8 text-center text-slate-500">Loading activity...</div>
          ) : activities.length === 0 ? (
             <div className="p-8 text-center text-slate-500">No recent activity.</div>
          ) : (
            activities.map(a => (
              <div key={a.id} className="p-4 rounded-xl border transition-all hover:bg-white/5 border-[rgba(255,255,255,0.05)] bg-black/20">
                <div className="flex gap-3 text-[13px] items-center">
                  <div className={`p-2 rounded-full ${
                    a.status === 'ALLOCATED' ? 'bg-blue-500/10 text-blue-400' :
                    a.status === 'RESOLVED' ? 'bg-green-500/10 text-green-400' :
                    'bg-amber-500/10 text-amber-400'
                  }`}>
                    <Activity size={14} />
                  </div>
                  <div>
                    <span className="font-semibold text-white">{a.actor}</span>
                    <span className="text-slate-400 mx-1">{a.action.toLowerCase()}</span>
                    <span className="font-medium text-blue-300">{a.entity}</span>
                    <span className="text-slate-500 text-[11px] ml-3">{a.time}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
      
      {tab === "alerts" && (
        <div className="glass rounded-xl p-12 flex flex-col items-center justify-center text-center border-[rgba(255,255,255,0.02)] h-64">
           <AlertCircle size={32} className="text-slate-600 mb-4" />
           <p className="text-[14px] text-slate-400 font-medium">No Alerts</p>
           <p className="text-[12px] text-slate-500 max-w-sm mt-1">Your system is healthy and there are no active alerts.</p>
        </div>
      )}
    </div>
  );
}
