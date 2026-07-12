"use client";
import { useState, useEffect } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { FilterBar, Select } from "@/components/ui/FilterBar";
import { Modal, FormField, Input, SelectField, Btn } from "@/components/ui/Modal";
import { apiFetch } from "@/lib/api";
import { Plus } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

const STATUS_OPTS = [
  { value: "", label: "All Statuses" },
  { value: "AVAILABLE", label: "Available" },
  { value: "ALLOCATED", label: "Allocated" },
  { value: "UNDER_MAINTENANCE", label: "Under Maintenance" },
  { value: "RESERVED", label: "Reserved" },
  { value: "RETIRED", label: "Retired" },
];

export default function AssetsPage() {
  const { isAdmin, isManager } = useAuth();
  const [assets, setAssets] = useState<any[]>([]);
  const [metadata, setMetadata] = useState<{ locations: any[], departments: any[], categories: any[] }>({ locations: [], departments: [], categories: [] });
  
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [modal, setModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    assetTag: "", serialNumber: "", name: "", categoryId: "", departmentId: "",
    locationId: "", purchaseCost: "", condition: "NEW", criticality: "MEDIUM",
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [ass, meta] = await Promise.all([
        apiFetch("/assets"),
        apiFetch("/metadata")
      ]);
      setAssets(ass);
      setMetadata(meta);
    } catch (e) {
      console.error(e);
    }
  };

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const filtered = assets.filter((a) => {
    const q = search.toLowerCase();
    const matchQ = !q || a.name.toLowerCase().includes(q) || a.assetTag.toLowerCase().includes(q);
    const matchS = !statusFilter || a.status === statusFilter;
    return matchQ && matchS;
  });

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault(); setError(""); setSaving(true);
    try {
      await apiFetch("/assets", { method: "POST", body: JSON.stringify(form) });
      setModal(false);
      fetchData(); // Refresh list
    } catch (err: unknown) { setError(err instanceof Error ? err.message : "Failed"); }
    finally { setSaving(false); }
  };

  return (
    <div className="animate-fade-in">
      <PageHeader 
        title="Asset Directory" 
        subtitle="Manage and track all physical assets across your organization."
        actions={
          (isAdmin || isManager) ? (
            <Btn onClick={() => setModal(true)}>
              <Plus size={14} className="inline mr-2" /> Register Asset
            </Btn>
          ) : undefined
        }
      />

      <FilterBar search={search} onSearch={setSearch} placeholder="Search by tag, name, or serial...">
        <Select value={statusFilter} onChange={setStatusFilter} options={STATUS_OPTS} />
      </FilterBar>

      <div className="rounded-xl glass border overflow-hidden">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="border-b" style={{ borderColor: "var(--border-subtle)", background: "rgba(255,255,255,0.02)" }}>
              {["Asset Tag", "Name", "Category", "Status", "Location"].map((h) => (
                <th key={h} className="text-left px-5 py-4 font-medium" style={{ color: "var(--text-secondary)" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={5} className="px-5 py-12 text-center" style={{ color: "var(--text-muted)" }}>No assets found matching your criteria.</td></tr>
            ) : filtered.map((a) => (
              <tr key={a.id} className="border-b transition-colors hover:bg-white/5 cursor-pointer"
                style={{ borderColor: "var(--border-subtle)" }}
              >
                <td className="px-5 py-4 font-mono text-blue-400 font-medium">{a.assetTag}</td>
                <td className="px-5 py-4 font-medium" style={{ color: "var(--text-primary)" }}>{a.name}</td>
                <td className="px-5 py-4" style={{ color: "var(--text-secondary)" }}>{a.category?.name || "—"}</td>
                <td className="px-5 py-4">
                  <span className={`px-3 py-1 rounded-full border text-[11px] font-medium tracking-wide capitalize ${
                    a.status === 'AVAILABLE' ? 'border-green-500/30 text-green-400 bg-green-500/10' :
                    a.status === 'ALLOCATED' ? 'border-blue-500/30 text-blue-400 bg-blue-500/10' :
                    a.status === 'UNDER_MAINTENANCE' ? 'border-amber-500/30 text-amber-400 bg-amber-500/10' :
                    'border-gray-500/30 text-gray-400 bg-gray-500/10'
                  }`}>
                    {a.status.toLowerCase().replace('_', ' ')}
                  </span>
                </td>
                <td className="px-5 py-4" style={{ color: "var(--text-secondary)" }}>{a.location?.name || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={modal} onClose={() => setModal(false)} title="Register New Asset" width="max-w-2xl">
        <form onSubmit={handleSave} className="space-y-4">
          {error && <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-lg">{error}</div>}
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Asset Tag"><Input required value={form.assetTag} onChange={set("assetTag")} placeholder="AST-001" /></FormField>
            <FormField label="Serial Number"><Input required value={form.serialNumber} onChange={set("serialNumber")} placeholder="SN-XXXX" /></FormField>
          </div>
          <FormField label="Asset Name"><Input required value={form.name} onChange={set("name")} placeholder="Dell XPS 15 Laptop" /></FormField>
          
          <div className="grid grid-cols-3 gap-4">
            <FormField label="Category">
              <SelectField required value={form.categoryId} onChange={set("categoryId")}>
                <option value="">Select...</option>
                {metadata.categories.map(c => <option key={c.id} value={c.id} className="bg-[#0f1117] text-white">{c.name}</option>)}
              </SelectField>
            </FormField>
            <FormField label="Department">
              <SelectField required value={form.departmentId} onChange={set("departmentId")}>
                <option value="">Select...</option>
                {metadata.departments.map(d => <option key={d.id} value={d.id} className="bg-[#0f1117] text-white">{d.name}</option>)}
              </SelectField>
            </FormField>
            <FormField label="Location">
              <SelectField required value={form.locationId} onChange={set("locationId")}>
                <option value="">Select...</option>
                {metadata.locations.map(l => <option key={l.id} value={l.id} className="bg-[#0f1117] text-white">{l.name}</option>)}
              </SelectField>
            </FormField>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Condition">
              <SelectField value={form.condition} onChange={set("condition")}>
                {["NEW", "EXCELLENT", "GOOD", "FAIR", "POOR"].map((c) => <option key={c} value={c} className="bg-[#0f1117] text-white">{c}</option>)}
              </SelectField>
            </FormField>
            <FormField label="Criticality">
              <SelectField value={form.criticality} onChange={set("criticality")}>
                {["LOW", "MEDIUM", "HIGH", "CRITICAL"].map((c) => <option key={c} value={c} className="bg-[#0f1117] text-white">{c}</option>)}
              </SelectField>
            </FormField>
          </div>
          <FormField label="Purchase Cost (USD)"><Input required type="number" value={form.purchaseCost} onChange={set("purchaseCost")} placeholder="1500" /></FormField>
          <div className="flex justify-end gap-3 pt-4 border-t border-[rgba(255,255,255,0.05)]">
            <Btn variant="ghost" type="button" onClick={() => setModal(false)}>Cancel</Btn>
            <Btn type="submit" disabled={saving}>{saving ? "Saving..." : "Register Asset"}</Btn>
          </div>
        </form>
      </Modal>
    </div>
  );
}
