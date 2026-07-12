"use client";
import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { PageHeader } from "@/components/ui/PageHeader";
import { Modal, FormField, Input, Btn, Textarea } from "@/components/ui/Modal";
import { Plus, ScanLine, Activity, Target } from "lucide-react";

export default function AuditPage() {
  const { user } = useAuth();
  const [cycles, setCycles] = useState<any[]>([]);
  const [tab, setTab] = useState<"current" | "past">("current");
  
  const [modal, setModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ name: "", startDate: "", endDate: "", scope: "" });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const data = await apiFetch("/audit");
      setCycles(data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault(); setError(""); setSaving(true);
    try {
      await apiFetch("/audit", { method: "POST", body: JSON.stringify(form) });
      setModal(false);
      fetchData();
    } catch (err: any) {
      setError(err.message || "Failed to create audit cycle");
    } finally {
      setSaving(false);
    }
  };

  const setF = (k: string) => (e: any) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const currentCycles = cycles.filter(c => c.status === "IN_PROGRESS");
  const pastCycles = cycles.filter(c => c.status !== "IN_PROGRESS");

  const displayCycles = tab === "current" ? currentCycles : pastCycles;

  return (
    <div className="animate-fade-in max-w-5xl">
      <PageHeader 
        title="Asset Audits" 
        subtitle="Manage inventory counts, discrepancy resolutions, and audit cycles."
        actions={
          <Btn onClick={() => { setForm({ name: "", startDate: "", endDate: "", scope: "" }); setModal(true); }}>
            <Plus size={14} className="inline mr-2" /> New Audit Cycle
          </Btn>
        }
      />

      <div className="flex gap-4 mb-6 border-b border-[rgba(255,255,255,0.05)]">
        <button 
          className={`px-4 py-2 text-[13px] tracking-wide transition-all ${tab === "current" ? "border-b-2 border-blue-500 font-medium text-blue-400" : "border-b-2 border-transparent text-slate-500 hover:text-slate-300"}`}
          onClick={() => setTab("current")}
        >
          Active Cycles ({currentCycles.length})
        </button>
        <button 
          className={`px-4 py-2 text-[13px] tracking-wide transition-all ${tab === "past" ? "border-b-2 border-blue-500 font-medium text-blue-400" : "border-b-2 border-transparent text-slate-500 hover:text-slate-300"}`}
          onClick={() => setTab("past")}
        >
          Completed Audits ({pastCycles.length})
        </button>
      </div>

      <div className="space-y-6">
        {displayCycles.length === 0 ? (
          <div className="glass rounded-xl p-12 flex flex-col items-center justify-center text-center border-[rgba(255,255,255,0.02)]">
            <Target size={36} className="text-slate-600 mb-4" />
            <h3 className="text-[15px] font-medium text-slate-300 mb-2">No {tab} audit cycles</h3>
            <p className="text-[13px] text-slate-500 max-w-sm">
              {tab === "current" ? "Create a new audit cycle to start tracking inventory accuracy." : "You haven't completed any audit cycles yet."}
            </p>
          </div>
        ) : (
          displayCycles.map(cycle => (
            <div key={cycle.id} className="glass-card rounded-xl p-6 relative overflow-hidden group border border-[rgba(255,255,255,0.05)]">
              {tab === "current" && (
                <div className="absolute top-0 left-0 w-1 h-full bg-blue-500/80" />
              )}
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-[16px] font-semibold tracking-wide mb-1 flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
                    {cycle.name}
                    {tab === "current" && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30">
                        ACTIVE
                      </span>
                    )}
                  </h2>
                  <p className="text-[13px] text-slate-400">{cycle.description}</p>
                </div>
                <div className="text-right">
                  <div className="text-[12px] font-medium mb-1 text-slate-400">
                    Cycle Dates
                  </div>
                  <div className="text-[13px]" style={{ color: "var(--text-primary)" }}>
                    {new Date(cycle.startDate).toLocaleDateString()} - {new Date(cycle.endDate).toLocaleDateString()}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-6 mb-6 p-4 rounded-lg bg-black/20 border border-[rgba(255,255,255,0.02)]">
                <div>
                  <p className="text-[11px] text-slate-500 mb-1 uppercase tracking-wider font-semibold">Total Scope</p>
                  <p className="text-[18px] font-medium text-white">{cycle.total || 0}</p>
                </div>
                <div>
                  <p className="text-[11px] text-green-500/80 mb-1 uppercase tracking-wider font-semibold">Verified</p>
                  <p className="text-[18px] font-medium text-green-400">{cycle.verified || 0}</p>
                </div>
                <div>
                  <p className="text-[11px] text-amber-500/80 mb-1 uppercase tracking-wider font-semibold">Discrepancies</p>
                  <p className="text-[18px] font-medium text-amber-400">{cycle.discrepancies || 0}</p>
                </div>
              </div>

              {tab === "current" && (
                <div className="flex gap-3 pt-2">
                  <Btn variant="primary">
                    <ScanLine size={14} className="inline mr-2" /> Scan Asset
                  </Btn>
                  <Btn variant="ghost">View Details</Btn>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      <Modal open={modal} onClose={() => setModal(false)} title="New Audit Cycle">
        <form onSubmit={handleSave} className="space-y-4">
          {error && <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-lg">{error}</div>}
          
          <FormField label="Cycle Name">
            <Input required value={form.name} onChange={setF("name")} placeholder="Q3 Annual IT Audit" />
          </FormField>
          
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Start Date">
              <Input type="date" required value={form.startDate} onChange={setF("startDate")} />
            </FormField>
            <FormField label="End Date">
              <Input type="date" required value={form.endDate} onChange={setF("endDate")} />
            </FormField>
          </div>

          <FormField label="Audit Scope">
            <Textarea required value={form.scope} onChange={setF("scope")} placeholder="E.g., All engineering department laptops..." />
          </FormField>
          
          <div className="flex justify-end gap-3 pt-4 border-t border-[rgba(255,255,255,0.05)]">
            <Btn variant="ghost" type="button" onClick={() => setModal(false)}>Cancel</Btn>
            <Btn type="submit" disabled={saving}>{saving ? "Creating..." : "Create Audit Cycle"}</Btn>
          </div>
        </form>
      </Modal>
    </div>
  );
}
