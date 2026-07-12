"use client";
import { useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Modal, FormField, Input, SelectField, Btn } from "@/components/ui/Modal";
import { apiFetch } from "@/lib/api";
import { Plus, Building2, MapPin } from "lucide-react";

// TODO: map to backend API — fetch departments and locations
const MOCK_DEPTS = [
  { id: "1", name: "Engineering",  code: "ENG", location: "HQ Floor 3",  manager: "Alice Wong" },
  { id: "2", name: "Operations",   code: "OPS", location: "HQ Floor 1",  manager: "Bob Smith" },
  { id: "3", name: "Finance",      code: "FIN", location: "HQ Floor 2",  manager: "Carol Lee" },
];

const MOCK_LOCS = [
  { id: "1", name: "HQ Floor 1", type: "OFFICE",     address: "123 Main St, Floor 1" },
  { id: "2", name: "HQ Floor 2", type: "OFFICE",     address: "123 Main St, Floor 2" },
  { id: "3", name: "HQ Floor 3", type: "OFFICE",     address: "123 Main St, Floor 3" },
  { id: "4", name: "Warehouse A", type: "WAREHOUSE",  address: "456 Storage Rd" },
];

export default function OrganizationPage() {
  const [tab, setTab] = useState<"departments" | "locations">("departments");
  const [deptModal, setDeptModal] = useState(false);
  const [locModal, setLocModal] = useState(false);
  const [deptForm, setDeptForm] = useState({ name: "", code: "", locationId: "" });
  const [locForm, setLocForm] = useState({ name: "", type: "OFFICE", address: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const setD = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setDeptForm((f) => ({ ...f, [k]: e.target.value }));
  const setL = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setLocForm((f) => ({ ...f, [k]: e.target.value }));

  const saveDept = async (e: React.FormEvent) => {
    e.preventDefault(); setError(""); setSaving(true);
    try {
      await apiFetch("/organizations/departments", { method: "POST", body: JSON.stringify(deptForm) });
      setDeptModal(false);
    } catch (err: unknown) { setError(err instanceof Error ? err.message : "Failed"); }
    finally { setSaving(false); }
  };

  const saveLoc = async (e: React.FormEvent) => {
    e.preventDefault(); setError(""); setSaving(true);
    try {
      await apiFetch("/organizations/locations", { method: "POST", body: JSON.stringify(locForm) });
      setLocModal(false);
    } catch (err: unknown) { setError(err instanceof Error ? err.message : "Failed"); }
    finally { setSaving(false); }
  };

  const TAB_CLS = (t: string) =>
    `px-3 py-1.5 text-[12px] rounded transition-colors ${tab === t ? "bg-blue-600/20 text-blue-400 font-medium" : "hover:bg-white/5"}`;

  return (
    <div>
      <PageHeader
        title="Organization Setup"
        subtitle="Manage departments and physical locations"
        actions={
          tab === "departments"
            ? <Btn onClick={() => setDeptModal(true)}><Plus size={12} className="inline mr-1" />Add Department</Btn>
            : <Btn onClick={() => setLocModal(true)}><Plus size={12} className="inline mr-1" />Add Location</Btn>
        }
      />

      {/* Tabs */}
      <div className="flex gap-1 mb-4 p-1 rounded-lg w-fit" style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}>
        <button className={TAB_CLS("departments")} style={tab !== "departments" ? { color: "var(--text-secondary)" } : {}} onClick={() => setTab("departments")}>
          <Building2 size={12} className="inline mr-1.5" />Departments
        </button>
        <button className={TAB_CLS("locations")} style={tab !== "locations" ? { color: "var(--text-secondary)" } : {}} onClick={() => setTab("locations")}>
          <MapPin size={12} className="inline mr-1.5" />Locations
        </button>
      </div>

      {/* Departments Table */}
      {tab === "departments" && (
        <div className="rounded-lg border overflow-hidden" style={{ borderColor: "var(--border)" }}>
          <table className="w-full text-[12px]">
            <thead>
              <tr style={{ background: "var(--bg-elevated)", borderBottom: "1px solid var(--border)" }}>
                {["Department", "Code", "Location", "Manager"].map((h) => (
                  <th key={h} className="text-left px-3 py-2.5 font-semibold" style={{ color: "var(--text-secondary)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {MOCK_DEPTS.map((d, i) => (
                <tr key={d.id} className="border-t" style={{ borderColor: "var(--border-subtle)", background: i % 2 === 0 ? "var(--bg-surface)" : "var(--bg-base)" }}>
                  <td className="px-3 py-2.5 font-medium" style={{ color: "var(--text-primary)" }}>{d.name}</td>
                  <td className="px-3 py-2.5" style={{ color: "var(--text-secondary)" }}>{d.code}</td>
                  <td className="px-3 py-2.5" style={{ color: "var(--text-secondary)" }}>{d.location}</td>
                  <td className="px-3 py-2.5" style={{ color: "var(--text-secondary)" }}>{d.manager}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Locations Table */}
      {tab === "locations" && (
        <div className="rounded-lg border overflow-hidden" style={{ borderColor: "var(--border)" }}>
          <table className="w-full text-[12px]">
            <thead>
              <tr style={{ background: "var(--bg-elevated)", borderBottom: "1px solid var(--border)" }}>
                {["Location", "Type", "Address"].map((h) => (
                  <th key={h} className="text-left px-3 py-2.5 font-semibold" style={{ color: "var(--text-secondary)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {MOCK_LOCS.map((l, i) => (
                <tr key={l.id} className="border-t" style={{ borderColor: "var(--border-subtle)", background: i % 2 === 0 ? "var(--bg-surface)" : "var(--bg-base)" }}>
                  <td className="px-3 py-2.5 font-medium" style={{ color: "var(--text-primary)" }}>{l.name}</td>
                  <td className="px-3 py-2.5">
                    <span className="px-2 py-0.5 rounded text-[11px] border" style={{ background: "var(--bg-elevated)", borderColor: "var(--border)", color: "var(--text-secondary)" }}>
                      {l.type}
                    </span>
                  </td>
                  <td className="px-3 py-2.5" style={{ color: "var(--text-secondary)" }}>{l.address}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Department Modal */}
      <Modal open={deptModal} onClose={() => setDeptModal(false)} title="Add Department">
        <form onSubmit={saveDept} className="space-y-3">
          {error && <p className="text-[12px] text-red-400">{error}</p>}
          <FormField label="Department Name"><Input required value={deptForm.name} onChange={setD("name")} placeholder="Engineering" /></FormField>
          <FormField label="Code"><Input required value={deptForm.code} onChange={setD("code")} placeholder="ENG" /></FormField>
          <FormField label="Location">
            <SelectField value={deptForm.locationId} onChange={setD("locationId")}>
              <option value="">Select location…</option>
              {MOCK_LOCS.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
            </SelectField>
          </FormField>
          <div className="flex justify-end gap-2 pt-1">
            <Btn variant="ghost" type="button" onClick={() => setDeptModal(false)}>Cancel</Btn>
            <Btn type="submit" disabled={saving}>{saving ? "Saving…" : "Create"}</Btn>
          </div>
        </form>
      </Modal>

      {/* Add Location Modal */}
      <Modal open={locModal} onClose={() => setLocModal(false)} title="Add Location">
        <form onSubmit={saveLoc} className="space-y-3">
          {error && <p className="text-[12px] text-red-400">{error}</p>}
          <FormField label="Location Name"><Input required value={locForm.name} onChange={setL("name")} placeholder="HQ Floor 1" /></FormField>
          <FormField label="Type">
            <SelectField value={locForm.type} onChange={setL("type")}>
              {["OFFICE", "WAREHOUSE", "REMOTE", "DATA_CENTER"].map((t) => <option key={t} value={t}>{t}</option>)}
            </SelectField>
          </FormField>
          <FormField label="Address"><Input value={locForm.address} onChange={setL("address")} placeholder="123 Main St" /></FormField>
          <div className="flex justify-end gap-2 pt-1">
            <Btn variant="ghost" type="button" onClick={() => setLocModal(false)}>Cancel</Btn>
            <Btn type="submit" disabled={saving}>{saving ? "Saving…" : "Create"}</Btn>
          </div>
        </form>
      </Modal>
    </div>
  );
}
