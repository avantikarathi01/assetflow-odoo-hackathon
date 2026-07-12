"use client";
import { useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { FilterBar, Select } from "@/components/ui/FilterBar";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Modal, FormField, Input, SelectField, Btn } from "@/components/ui/Modal";
import { apiFetch } from "@/lib/api";
import { Plus } from "lucide-react";

// TODO: map to backend API — fetch assets list
const MOCK_ASSETS = [
  { id: "1", assetTag: "AST-001", name: "Dell XPS 15 Laptop",    category: "Laptops",    department: "Engineering", location: "HQ Floor 3", status: "ALLOCATED",  condition: "GOOD",      purchaseCost: 1800 },
  { id: "2", assetTag: "AST-002", name: "iPhone 14 Pro",          category: "Phones",     department: "Sales",       location: "HQ Floor 1", status: "AVAILABLE",  condition: "EXCELLENT", purchaseCost: 1100 },
  { id: "3", assetTag: "AST-003", name: "HP LaserJet Pro",        category: "Printers",   department: "Operations",  location: "HQ Floor 1", status: "AVAILABLE",  condition: "GOOD",      purchaseCost: 450 },
  { id: "4", assetTag: "AST-004", name: "Cisco Switch 24-Port",   category: "Networking", department: "IT",          location: "Server Room",status: "UNDER_MAINTENANCE", condition: "FAIR", purchaseCost: 2200 },
  { id: "5", assetTag: "AST-005", name: "MacBook Pro M3",         category: "Laptops",    department: "Design",      location: "HQ Floor 2", status: "ALLOCATED",  condition: "EXCELLENT", purchaseCost: 2400 },
  { id: "6", assetTag: "AST-006", name: "Standing Desk",          category: "Furniture",  department: "HR",          location: "HQ Floor 2", status: "AVAILABLE",  condition: "GOOD",      purchaseCost: 600 },
  { id: "7", assetTag: "AST-007", name: "Projector Epson EB-X51", category: "AV",         department: "Operations",  location: "Conf Room A",status: "RESERVED",   condition: "GOOD",      purchaseCost: 750 },
];

const STATUS_OPTS = [
  { value: "", label: "All Statuses" },
  { value: "AVAILABLE", label: "Available" },
  { value: "ALLOCATED", label: "Allocated" },
  { value: "UNDER_MAINTENANCE", label: "Under Maintenance" },
  { value: "RESERVED", label: "Reserved" },
  { value: "RETIRED", label: "Retired" },
];

export default function AssetsPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [modal, setModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    assetTag: "", serialNumber: "", name: "", categoryId: "", departmentId: "",
    locationId: "", purchaseCost: "", condition: "NEW", criticality: "MEDIUM",
  });

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const filtered = MOCK_ASSETS.filter((a) => {
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
    } catch (err: unknown) { setError(err instanceof Error ? err.message : "Failed"); }
    finally { setSaving(false); }
  };

  return (
    <div>
      <PageHeader
        title="Asset Directory"
        subtitle={`${MOCK_ASSETS.length} assets registered`}
        actions={<Btn onClick={() => setModal(true)}><Plus size={12} className="inline mr-1" />Register Asset</Btn>}
      />

      <FilterBar search={search} onSearch={setSearch} placeholder="Search by name or tag…">
        <Select value={statusFilter} onChange={setStatusFilter} options={STATUS_OPTS} />
      </FilterBar>

      <div className="rounded-lg border overflow-hidden" style={{ borderColor: "var(--border)" }}>
        <table className="w-full text-[12px]">
          <thead>
            <tr style={{ background: "var(--bg-elevated)", borderBottom: "1px solid var(--border)" }}>
              {["Tag", "Asset Name", "Category", "Department", "Location", "Status", "Condition", "Cost"].map((h) => (
                <th key={h} className="text-left px-3 py-2.5 font-semibold" style={{ color: "var(--text-secondary)" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={8} className="px-3 py-8 text-center" style={{ color: "var(--text-muted)" }}>No assets found.</td></tr>
            ) : filtered.map((a, i) => (
              <tr key={a.id} className="border-t transition-colors cursor-pointer"
                style={{ borderColor: "var(--border-subtle)", background: i % 2 === 0 ? "var(--bg-surface)" : "var(--bg-base)" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-hover)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = i % 2 === 0 ? "var(--bg-surface)" : "var(--bg-base)")}
              >
                <td className="px-3 py-2.5 font-mono text-[11px]" style={{ color: "var(--text-muted)" }}>{a.assetTag}</td>
                <td className="px-3 py-2.5 font-medium" style={{ color: "var(--text-primary)" }}>{a.name}</td>
                <td className="px-3 py-2.5" style={{ color: "var(--text-secondary)" }}>{a.category}</td>
                <td className="px-3 py-2.5" style={{ color: "var(--text-secondary)" }}>{a.department}</td>
                <td className="px-3 py-2.5" style={{ color: "var(--text-secondary)" }}>{a.location}</td>
                <td className="px-3 py-2.5"><StatusBadge status={a.status} /></td>
                <td className="px-3 py-2.5" style={{ color: "var(--text-secondary)" }}>{a.condition}</td>
                <td className="px-3 py-2.5" style={{ color: "var(--text-secondary)" }}>${a.purchaseCost.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={modal} onClose={() => setModal(false)} title="Register New Asset" width="max-w-xl">
        <form onSubmit={handleSave} className="space-y-3">
          {error && <p className="text-[12px] text-red-400">{error}</p>}
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Asset Tag"><Input required value={form.assetTag} onChange={set("assetTag")} placeholder="AST-001" /></FormField>
            <FormField label="Serial Number"><Input value={form.serialNumber} onChange={set("serialNumber")} placeholder="SN-XXXX" /></FormField>
          </div>
          <FormField label="Asset Name"><Input required value={form.name} onChange={set("name")} placeholder="Dell XPS 15 Laptop" /></FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Condition">
              <SelectField value={form.condition} onChange={set("condition")}>
                {["NEW", "EXCELLENT", "GOOD", "FAIR", "POOR"].map((c) => <option key={c} value={c}>{c}</option>)}
              </SelectField>
            </FormField>
            <FormField label="Criticality">
              <SelectField value={form.criticality} onChange={set("criticality")}>
                {["LOW", "MEDIUM", "HIGH", "CRITICAL"].map((c) => <option key={c} value={c}>{c}</option>)}
              </SelectField>
            </FormField>
          </div>
          <FormField label="Purchase Cost (USD)"><Input type="number" value={form.purchaseCost} onChange={set("purchaseCost")} placeholder="1500" /></FormField>
          <div className="flex justify-end gap-2 pt-1">
            <Btn variant="ghost" type="button" onClick={() => setModal(false)}>Cancel</Btn>
            <Btn type="submit" disabled={saving}>{saving ? "Saving…" : "Register Asset"}</Btn>
          </div>
        </form>
      </Modal>
    </div>
  );
}
