"use client";
import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";
import { PageHeader } from "@/components/ui/PageHeader";
import { FilterBar } from "@/components/ui/FilterBar";
import { Modal, FormField, Input, SelectField, Btn, Textarea } from "@/components/ui/Modal";
import { EmptyState } from "@/components/ui/EmptyState";
import { Spinner } from "@/components/ui/Spinner";
import { Plus, WrenchIcon } from "lucide-react";

export default function MaintenancePage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [assets, setAssets] = useState<any[]>([]);
  const [filterAsset, setFilterAsset] = useState("");
  
  const [modal, setModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ assetId: "", issue: "", priority: "MEDIUM" });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setInitialLoading(true);
    try {
      const [reqs, ass] = await Promise.all([
        apiFetch("/maintenance"),
        apiFetch("/assets")
      ]);
      setRequests(reqs);
      setAssets(ass);
    } catch (e) {
      console.error(e);
    } finally {
      setInitialLoading(false);
    }
  };

  const filtered = requests.filter(r => !filterAsset || r.asset?.name.toLowerCase().includes(filterAsset.toLowerCase()));

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault(); setError(""); setSaving(true);
    try {
      await apiFetch("/maintenance", { method: "POST", body: JSON.stringify(form) });
      setModal(false);
      fetchData();
    } catch (err: any) {
      setError(err.message || "Failed to submit request");
    } finally {
      setSaving(false);
    }
  };

  const setF = (k: string) => (e: any) => setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <div className="animate-fade-in max-w-5xl">
      <PageHeader 
        title="Asset Maintenance" 
        subtitle="Route repairs through approval workflow and track issue resolution."
        actions={
          <Btn onClick={() => { setForm({ assetId: "", issue: "", priority: "MEDIUM" }); setModal(true); }}>
            <Plus size={14} className="inline mr-2" /> Raise Request
          </Btn>
        }
      />

      <FilterBar search={filterAsset} onSearch={setFilterAsset} placeholder="Filter by asset name or issue..." />

      <div className="rounded-xl glass border overflow-hidden">
        {initialLoading ? (
          <Spinner />
        ) : (
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b" style={{ borderColor: "var(--border-subtle)", background: "rgba(255,255,255,0.02)" }}>
                {["Asset", "Issue", "Reported", "Priority", "Status", "Resolution"].map((h) => (
                  <th key={h} className="text-left px-5 py-4 font-medium" style={{ color: "var(--text-secondary)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                 <tr>
                  <td colSpan={6} className="p-8">
                    <EmptyState
                      icon={WrenchIcon}
                      title="No Maintenance Requests"
                      description="No maintenance tickets found. Raise a new request using the button above to report an asset issue."
                    />
                  </td>
                </tr>
              ) : filtered.map((r, i) => (
                <tr key={r.id} className="border-b transition-colors hover:bg-white/5 cursor-pointer" style={{ borderColor: "var(--border-subtle)" }}>
                  <td className="px-5 py-4 font-medium" style={{ color: "var(--text-primary)" }}>{r.asset?.name || "Unknown Asset"}</td>
                  <td className="px-5 py-4" style={{ color: "var(--text-secondary)" }}>{r.issue || r.description || "Unknown Issue"}</td>
                  <td className="px-5 py-4 text-[12px]" style={{ color: "var(--text-secondary)" }}>
                    {new Date(r.createdAt || r.reportedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="px-5 py-4">
                    <span className={`px-2.5 py-1 rounded border text-[10px] font-bold tracking-wider ${
                      r.priority === 'CRITICAL' || r.priority === 'HIGH' ? 'border-red-500/30 text-red-400 bg-red-500/10' :
                      r.priority === 'MEDIUM' ? 'border-amber-500/30 text-amber-400 bg-amber-500/10' :
                      'border-blue-500/30 text-blue-400 bg-blue-500/10'
                    }`}>
                      {r.priority || 'MEDIUM'}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`px-3 py-1 rounded-full border text-[11px] font-medium tracking-wide capitalize ${
                      r.status === 'PENDING' ? 'border-gray-500/30 text-gray-400 bg-gray-500/10' :
                      r.status === 'IN_REPAIR' || r.status === 'IN_PROGRESS' ? 'border-blue-500/30 text-blue-400 bg-blue-500/10' :
                      r.status === 'RESOLVED' || r.status === 'COMPLETED' ? 'border-green-500/30 text-green-400 bg-green-500/10' :
                      'border-amber-500/30 text-amber-400 bg-amber-500/10'
                    }`}>
                      {r.status === 'PENDING' ? 'Open' : r.status.toLowerCase().replace('_', '-')}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-[12px]" style={{ color: "var(--text-secondary)" }}>{r.resolutionNotes || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Modal open={modal} onClose={() => setModal(false)} title="Raise Maintenance Request">
        <form onSubmit={handleSave} className="space-y-4">
          {error && <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-lg">{error}</div>}
          
          <FormField label="Asset">
            <SelectField required value={form.assetId} onChange={setF("assetId")}>
              <option value="">Select an asset...</option>
              {assets.map(a => <option key={a.id} value={a.id} className="bg-[#0f1117] text-white">[{a.assetTag}] {a.name}</option>)}
            </SelectField>
          </FormField>
          
          <FormField label="Priority">
            <SelectField required value={form.priority} onChange={setF("priority")}>
              {["LOW", "MEDIUM", "HIGH", "CRITICAL"].map(p => <option key={p} value={p} className="bg-[#0f1117] text-white">{p}</option>)}
            </SelectField>
          </FormField>

          <FormField label="Issue Description">
            <Textarea required value={form.issue} onChange={setF("issue")} placeholder="Describe the problem..." />
          </FormField>
          
          <div className="flex justify-end gap-3 pt-4 border-t border-[rgba(255,255,255,0.05)]">
            <Btn variant="ghost" type="button" onClick={() => setModal(false)}>Cancel</Btn>
            <Btn type="submit" disabled={saving}>{saving ? "Submitting..." : "Submit Request"}</Btn>
          </div>
        </form>
      </Modal>
    </div>
  );
}
