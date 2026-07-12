"use client";
import { useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { FilterBar, Select } from "@/components/ui/FilterBar";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Modal, FormField, Input, Textarea, SelectField, Btn } from "@/components/ui/Modal";
import { apiFetch } from "@/lib/api";
import { Plus, CheckCircle, XCircle } from "lucide-react";

// TODO: map to backend API
const MOCK_REQUESTS = [
  { id: "1", ref: "MNT-001", asset: "Cisco Switch 24-Port", assetTag: "AST-004", issue: "Port 12 not responding", priority: "HIGH",     requestedBy: "IT Team",   requestedAt: "2025-01-18", status: "IN_REPAIR",  technician: "Dave Tech" },
  { id: "2", ref: "MNT-002", asset: "HP LaserJet Pro",      assetTag: "AST-003", issue: "Paper jam recurring",    priority: "MEDIUM",   requestedBy: "Bob Smith", requestedAt: "2025-01-20", status: "PENDING",    technician: null },
  { id: "3", ref: "MNT-003", asset: "Dell XPS 15",          assetTag: "AST-001", issue: "Battery not charging",   priority: "HIGH",     requestedBy: "John Doe",  requestedAt: "2025-01-21", status: "APPROVED",   technician: "Dave Tech" },
  { id: "4", ref: "MNT-004", asset: "Epson Projector",      assetTag: "AST-007", issue: "Lamp replacement needed",priority: "LOW",      requestedBy: "Ops Team",  requestedAt: "2025-01-15", status: "RESOLVED",   technician: "Sam Fix" },
  { id: "5", ref: "MNT-005", asset: "MacBook Pro M3",       assetTag: "AST-005", issue: "Keyboard key stuck",     priority: "MEDIUM",   requestedBy: "Jane Smith",requestedAt: "2025-01-22", status: "PENDING",    technician: null },
];

const STATUS_OPTS = [
  { value: "", label: "All Statuses" },
  { value: "PENDING", label: "Pending" },
  { value: "APPROVED", label: "Approved" },
  { value: "ASSIGNED", label: "Assigned" },
  { value: "IN_REPAIR", label: "In Repair" },
  { value: "RESOLVED", label: "Resolved" },
  { value: "CANCELLED", label: "Cancelled" },
];

export default function MaintenancePage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [modal, setModal] = useState(false);
  const [resolveModal, setResolveModal] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ assetId: "", issue: "", priority: "MEDIUM" });
  const [resolveNotes, setResolveNotes] = useState("");

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const filtered = MOCK_REQUESTS.filter((r) => {
    const q = search.toLowerCase();
    return (!q || r.asset.toLowerCase().includes(q) || r.ref.toLowerCase().includes(q))
      && (!statusFilter || r.status === statusFilter);
  });

  const handleRaise = async (e: React.FormEvent) => {
    e.preventDefault(); setError(""); setSaving(true);
    try {
      await apiFetch("/maintenance", { method: "POST", body: JSON.stringify(form) });
      setModal(false);
    } catch (err: unknown) { setError(err instanceof Error ? err.message : "Failed"); }
    finally { setSaving(false); }
  };

  const handleApprove = async (id: string) => {
    try { await apiFetch(`/maintenance/${id}/approve`, { method: "POST", body: JSON.stringify({}) }); }
    catch { /* TODO: toast */ }
  };

  const handleResolve = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    try {
      await apiFetch(`/maintenance/${resolveModal}/resolve`, { method: "POST", body: JSON.stringify({ resolutionNotes: resolveNotes }) });
      setResolveModal(null);
    } catch { /* TODO: toast */ }
    finally { setSaving(false); }
  };

  // Summary counts
  const counts = { PENDING: 0, APPROVED: 0, IN_REPAIR: 0, RESOLVED: 0 };
  MOCK_REQUESTS.forEach((r) => { if (r.status in counts) counts[r.status as keyof typeof counts]++; });

  return (
    <div>
      <PageHeader
        title="Maintenance Management"
        subtitle="Track and approve asset repair requests"
        actions={<Btn onClick={() => setModal(true)}><Plus size={12} className="inline mr-1" />Raise Request</Btn>}
      />

      {/* Pipeline summary */}
      <div className="grid grid-cols-4 gap-3 mb-5">
        {(["PENDING", "APPROVED", "IN_REPAIR", "RESOLVED"] as const).map((s) => (
          <div key={s} className="rounded-lg border p-3 flex items-center justify-between" style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}>
            <div>
              <p className="text-[11px]" style={{ color: "var(--text-secondary)" }}>{s.replace("_", " ")}</p>
              <p className="text-xl font-bold mt-0.5" style={{ color: "var(--text-primary)" }}>{counts[s]}</p>
            </div>
            <StatusBadge status={s} />
          </div>
        ))}
      </div>

      <FilterBar search={search} onSearch={setSearch} placeholder="Search asset or ref…">
        <Select value={statusFilter} onChange={setStatusFilter} options={STATUS_OPTS} />
      </FilterBar>

      <div className="rounded-lg border overflow-hidden" style={{ borderColor: "var(--border)" }}>
        <table className="w-full text-[12px]">
          <thead>
            <tr style={{ background: "var(--bg-elevated)", borderBottom: "1px solid var(--border)" }}>
              {["Ref", "Asset", "Issue", "Priority", "Requested By", "Date", "Technician", "Status", "Actions"].map((h) => (
                <th key={h} className="text-left px-3 py-2.5 font-semibold" style={{ color: "var(--text-secondary)" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((r, i) => (
              <tr key={r.id} className="border-t" style={{ borderColor: "var(--border-subtle)", background: i % 2 === 0 ? "var(--bg-surface)" : "var(--bg-base)" }}>
                <td className="px-3 py-2.5 font-mono text-[11px]" style={{ color: "var(--text-muted)" }}>{r.ref}</td>
                <td className="px-3 py-2.5">
                  <p className="font-medium" style={{ color: "var(--text-primary)" }}>{r.asset}</p>
                  <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>{r.assetTag}</p>
                </td>
                <td className="px-3 py-2.5 max-w-[180px] truncate" style={{ color: "var(--text-secondary)" }}>{r.issue}</td>
                <td className="px-3 py-2.5"><StatusBadge status={r.priority} /></td>
                <td className="px-3 py-2.5" style={{ color: "var(--text-secondary)" }}>{r.requestedBy}</td>
                <td className="px-3 py-2.5" style={{ color: "var(--text-secondary)" }}>{r.requestedAt}</td>
                <td className="px-3 py-2.5" style={{ color: "var(--text-secondary)" }}>{r.technician ?? "—"}</td>
                <td className="px-3 py-2.5"><StatusBadge status={r.status} /></td>
                <td className="px-3 py-2.5">
                  <div className="flex gap-1">
                    {r.status === "PENDING" && (
                      <button onClick={() => handleApprove(r.id)} className="p-1 rounded hover:bg-emerald-900/30" title="Approve">
                        <CheckCircle size={13} className="text-emerald-400" />
                      </button>
                    )}
                    {r.status === "PENDING" && (
                      <button className="p-1 rounded hover:bg-red-900/30" title="Reject">
                        <XCircle size={13} className="text-red-400" />
                      </button>
                    )}
                    {(r.status === "APPROVED" || r.status === "IN_REPAIR") && (
                      <button onClick={() => setResolveModal(r.id)} className="text-[11px] px-2 py-1 rounded border hover:opacity-80" style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}>
                        Resolve
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Raise Request Modal */}
      <Modal open={modal} onClose={() => setModal(false)} title="Raise Maintenance Request">
        <form onSubmit={handleRaise} className="space-y-3">
          {error && <p className="text-[12px] text-red-400">{error}</p>}
          <FormField label="Asset ID"><Input required value={form.assetId} onChange={set("assetId")} placeholder="Asset UUID" /></FormField>
          <FormField label="Issue Description"><Textarea required value={form.issue} onChange={set("issue")} placeholder="Describe the issue…" /></FormField>
          <FormField label="Priority">
            <SelectField value={form.priority} onChange={set("priority")}>
              {["LOW", "MEDIUM", "HIGH", "CRITICAL"].map((p) => <option key={p} value={p}>{p}</option>)}
            </SelectField>
          </FormField>
          <div className="flex justify-end gap-2 pt-1">
            <Btn variant="ghost" type="button" onClick={() => setModal(false)}>Cancel</Btn>
            <Btn type="submit" disabled={saving}>{saving ? "Submitting…" : "Submit Request"}</Btn>
          </div>
        </form>
      </Modal>

      {/* Resolve Modal */}
      <Modal open={!!resolveModal} onClose={() => setResolveModal(null)} title="Resolve Maintenance Request">
        <form onSubmit={handleResolve} className="space-y-3">
          <FormField label="Resolution Notes"><Textarea required value={resolveNotes} onChange={(e) => setResolveNotes(e.target.value)} placeholder="Describe what was done…" /></FormField>
          <div className="flex justify-end gap-2 pt-1">
            <Btn variant="ghost" type="button" onClick={() => setResolveModal(null)}>Cancel</Btn>
            <Btn type="submit" disabled={saving}>{saving ? "Resolving…" : "Mark Resolved"}</Btn>
          </div>
        </form>
      </Modal>
    </div>
  );
}
