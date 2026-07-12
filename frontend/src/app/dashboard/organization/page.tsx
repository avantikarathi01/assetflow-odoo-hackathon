"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Modal, FormField, Input, Btn, SelectField } from "@/components/ui/Modal";
import { apiFetch } from "@/lib/api";

export default function OrganizationPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState<"departments" | "categories" | "employees">("departments");
  
  const [departments, setDepartments] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);

  const [modal, setModal] = useState<"dept"|"cat"|null>(null);
  const [form, setForm] = useState<any>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [meta, users] = await Promise.all([
        apiFetch("/metadata"),
        apiFetch("/org/users")
      ]);
      setDepartments(meta.departments);
      setCategories(meta.categories);
      setLocations(meta.locations);
      setEmployees(users);
    } catch (e) {
      console.error(e);
    }
  };

  const setF = (k: string) => (e: any) => setForm((f: any) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (modal === "dept") await apiFetch("/org/departments", { method: "POST", body: JSON.stringify(form) });
      if (modal === "cat") await apiFetch("/org/categories", { method: "POST", body: JSON.stringify(form) });
      setModal(null);
      fetchData();
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  // Basic RBAC guard
  if (user && !user.roles.includes("ADMIN")) {
    return <div className="p-8 text-center text-red-400 glass-card rounded-xl">You do not have permission to view this page.</div>;
  }

  const TAB_CLS = (t: string) =>
    `px-4 py-2 text-[13px] font-medium border-b-2 transition-colors ${tab === t ? "border-blue-500 text-blue-400" : "border-transparent text-slate-500 hover:text-slate-300"}`;

  return (
    <div className="animate-fade-in">
      <PageHeader 
        title="Organization Setup" 
        subtitle="Manage departments, categories, and personnel structure"
        actions={
          <Btn onClick={() => { setForm({}); setModal(tab === "categories" ? "cat" : "dept"); }}>
            <Plus size={14} className="inline mr-2" /> Add {tab === "categories" ? "Category" : "Department"}
          </Btn>
        }
      />
      
      <div className="flex gap-4 mb-6 border-b" style={{ borderColor: "var(--border-subtle)" }}>
        <button className={TAB_CLS("departments")} onClick={() => setTab("departments")}>Departments</button>
        <button className={TAB_CLS("categories")} onClick={() => setTab("categories")}>Categories</button>
        <button className={TAB_CLS("employees")} onClick={() => setTab("employees")}>Employees</button>
      </div>

      <div className="rounded-xl glass border overflow-hidden">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="border-b" style={{ borderColor: "var(--border-subtle)", background: "rgba(255,255,255,0.02)" }}>
              {tab === "departments" && <>
                <th className="text-left px-5 py-3 font-medium" style={{ color: "var(--text-secondary)" }}>Department Name</th>
                <th className="text-left px-5 py-3 font-medium" style={{ color: "var(--text-secondary)" }}>Code</th>
                <th className="text-left px-5 py-3 font-medium" style={{ color: "var(--text-secondary)" }}>Status</th>
              </>}
              {tab === "categories" && <>
                <th className="text-left px-5 py-3 font-medium" style={{ color: "var(--text-secondary)" }}>Category Name</th>
                <th className="text-left px-5 py-3 font-medium" style={{ color: "var(--text-secondary)" }}>Description</th>
              </>}
              {tab === "employees" && <>
                <th className="text-left px-5 py-3 font-medium" style={{ color: "var(--text-secondary)" }}>Name</th>
                <th className="text-left px-5 py-3 font-medium" style={{ color: "var(--text-secondary)" }}>Email</th>
                <th className="text-left px-5 py-3 font-medium" style={{ color: "var(--text-secondary)" }}>Roles</th>
              </>}
            </tr>
          </thead>
          <tbody>
            {tab === "departments" && departments.map((d, i) => (
              <tr key={d.id} className="border-b transition-colors hover:bg-white/5" style={{ borderColor: "var(--border-subtle)" }}>
                <td className="px-5 py-3.5" style={{ color: "var(--text-primary)" }}>{d.name}</td>
                <td className="px-5 py-3.5" style={{ color: "var(--text-secondary)" }}>{d.code}</td>
                <td className="px-5 py-3.5">
                  <span className="px-3 py-1 rounded-full border border-green-500/30 text-green-400 text-[11px] font-medium tracking-wide bg-green-500/10">Active</span>
                </td>
              </tr>
            ))}
            {tab === "categories" && categories.map((c, i) => (
              <tr key={c.id} className="border-b transition-colors hover:bg-white/5" style={{ borderColor: "var(--border-subtle)" }}>
                <td className="px-5 py-3.5 font-medium text-blue-400">{c.name}</td>
                <td className="px-5 py-3.5" style={{ color: "var(--text-secondary)" }}>{c.description || "—"}</td>
              </tr>
            ))}
            {tab === "employees" && employees.map((e, i) => (
              <tr key={e.id} className="border-b transition-colors hover:bg-white/5" style={{ borderColor: "var(--border-subtle)" }}>
                <td className="px-5 py-3.5 font-medium" style={{ color: "var(--text-primary)" }}>{e.firstName} {e.lastName}</td>
                <td className="px-5 py-3.5" style={{ color: "var(--text-secondary)" }}>{e.email}</td>
                <td className="px-5 py-3.5">
                  <span className="px-3 py-1 rounded-full border border-blue-500/30 text-blue-400 text-[11px] font-medium tracking-wide bg-blue-500/10">{e.roles[0]}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={!!modal} onClose={() => setModal(null)} title={`Add ${modal === "dept" ? "Department" : "Category"}`}>
        <form onSubmit={handleSubmit} className="space-y-4">
          {modal === "dept" && (
            <>
              <FormField label="Department Name"><Input required value={form.name || ""} onChange={setF("name")} placeholder="Engineering" /></FormField>
              <FormField label="Department Code"><Input required value={form.code || ""} onChange={setF("code")} placeholder="ENG" /></FormField>
              <FormField label="Location">
                <SelectField required value={form.locationId || ""} onChange={setF("locationId")}>
                  <option value="">Select location...</option>
                  {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                </SelectField>
              </FormField>
            </>
          )}
          {modal === "cat" && (
            <>
              <FormField label="Category Name"><Input required value={form.name || ""} onChange={setF("name")} placeholder="Electronics" /></FormField>
              <FormField label="Description"><Input value={form.description || ""} onChange={setF("description")} placeholder="Laptops, Monitors..." /></FormField>
            </>
          )}
          <div className="flex justify-end gap-3 pt-4 border-t border-[rgba(255,255,255,0.05)]">
            <Btn variant="ghost" type="button" onClick={() => setModal(null)}>Cancel</Btn>
            <Btn type="submit" disabled={saving}>{saving ? "Saving..." : "Save"}</Btn>
          </div>
        </form>
      </Modal>
    </div>
  );
}
