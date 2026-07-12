"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Modal, FormField, Input, Btn, SelectField } from "@/components/ui/Modal";
import { Spinner } from "@/components/ui/Spinner";
import { apiFetch } from "@/lib/api";
import { primaryRole, roleNames } from "@/lib/roles";

type Department = { id: string; name: string; code: string };
type Category = { id: string; name: string; description?: string | null };
type Location = { id: string; name: string };
type Employee = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  roles?: unknown[];
  userRoles?: unknown[];
};
type OrganizationForm = {
  name?: string;
  code?: string;
  locationId?: string;
  description?: string;
};

export default function OrganizationPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState<"departments" | "categories" | "employees">("departments");
  
  const [departments, setDepartments] = useState<Department[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);

  const [modal, setModal] = useState<"dept"|"cat"|null>(null);
  const [form, setForm] = useState<OrganizationForm>({});
  const [saving, setSaving] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  const fetchData = async () => {
    setInitialLoading(true);
    try {
      const [meta, users] = await Promise.all([
        apiFetch("/metadata"),
        apiFetch("/organizations/users")
      ]);
      setDepartments(meta.departments);
      setCategories(meta.categories);
      setLocations(meta.locations);
      setEmployees(users);
    } catch (e) {
      console.error(e);
    } finally {
      setInitialLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData();
  }, []);

  const setF = (k: keyof OrganizationForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (modal === "dept") await apiFetch("/organizations/departments", { method: "POST", body: JSON.stringify(form) });
      if (modal === "cat") await apiFetch("/organizations/categories", { method: "POST", body: JSON.stringify(form) });
      setModal(null);
      fetchData();
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  // Basic RBAC guard
  if (user && !roleNames(user.roles).includes("ADMIN")) {
    return <div className="p-8 text-center glass-card rounded-xl" style={{ color: "var(--danger)" }}>You do not have permission to view this page.</div>;
  }

  const TAB_CLS = (t: string) =>
    `px-4 py-2 rounded-xl text-[13px] font-bold border transition-all ${tab === t ? "border-[var(--accent)] text-[var(--accent)] bg-[var(--accent-glow)]" : "border-transparent text-[var(--text-secondary)] hover:bg-slate-500/10"}`;

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
      
      <div className="flex gap-2 mb-6">
        <button className={TAB_CLS("departments")} onClick={() => setTab("departments")}>Departments</button>
        <button className={TAB_CLS("categories")} onClick={() => setTab("categories")}>Categories</button>
        <button className={TAB_CLS("employees")} onClick={() => setTab("employees")}>Employees</button>
      </div>

      <div className="rounded-xl glass border overflow-hidden">
        {initialLoading ? (
          <Spinner />
        ) : (
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b" style={{ borderColor: "var(--border-subtle)", background: "var(--bg-hover)" }}>
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
              {tab === "departments" && departments.map((d) => (
                <tr key={d.id} className="border-b transition-colors hover:bg-slate-500/10" style={{ borderColor: "var(--border-subtle)" }}>
                  <td className="px-5 py-3.5" style={{ color: "var(--text-primary)" }}>{d.name}</td>
                  <td className="px-5 py-3.5" style={{ color: "var(--text-secondary)" }}>{d.code}</td>
                  <td className="px-5 py-3.5">
                    <span className="px-3 py-1 rounded-full border border-green-500/30 text-green-400 text-[11px] font-medium tracking-wide bg-green-500/10">Active</span>
                  </td>
                </tr>
              ))}
              {tab === "categories" && categories.map((c) => (
                <tr key={c.id} className="border-b transition-colors hover:bg-slate-500/10" style={{ borderColor: "var(--border-subtle)" }}>
                  <td className="px-5 py-3.5 font-medium" style={{ color: "var(--accent)" }}>{c.name}</td>
                  <td className="px-5 py-3.5" style={{ color: "var(--text-secondary)" }}>{c.description || "—"}</td>
                </tr>
              ))}
              {tab === "employees" && employees.map((e) => (
                <tr key={e.id} className="border-b transition-colors hover:bg-slate-500/10" style={{ borderColor: "var(--border-subtle)" }}>
                  <td className="px-5 py-3.5 font-medium" style={{ color: "var(--text-primary)" }}>{e.firstName} {e.lastName}</td>
                  <td className="px-5 py-3.5" style={{ color: "var(--text-secondary)" }}>{e.email}</td>
                  <td className="px-5 py-3.5">
                    <span className="px-3 py-1 rounded-full border text-[11px] font-medium tracking-wide" style={{ borderColor: "var(--accent-glow)", color: "var(--accent)", background: "var(--accent-glow)" }}>{primaryRole(e.roles ?? e.userRoles)}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
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
