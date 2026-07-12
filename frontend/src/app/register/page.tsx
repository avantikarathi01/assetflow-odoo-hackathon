"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { Package } from "lucide-react";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ orgName: "", orgId: "", adminName: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const parts = form.adminName.trim().split(" ");
      const firstName = parts[0] || "Admin";
      const lastName = parts.slice(1).join(" ") || "User";

      await apiFetch("/auth/register", {
        method: "POST",
        body: JSON.stringify({ 
          organizationName: form.orgName, 
          slug: form.orgId,
          firstName, 
          lastName, 
          email: form.email, 
          password: form.password 
        }),
      });
      router.push("/login");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: "var(--bg-base)" }}>
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2 mb-8 justify-center">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
            <Package size={16} className="text-white" />
          </div>
          <span className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>AssetFlow</span>
        </div>

        <div className="rounded-lg border p-6" style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}>
          <h1 className="text-[14px] font-semibold mb-1" style={{ color: "var(--text-primary)" }}>Register your organization</h1>
          <p className="text-[12px] mb-5" style={{ color: "var(--text-secondary)" }}>Creates an admin account and organization workspace</p>

          {error && (
            <div className="mb-4 px-3 py-2 rounded text-[12px]" style={{ background: "var(--danger)", color: "#fff", opacity: 0.9 }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3">
            {[
              { key: "orgName",    label: "Organization Name", type: "text",     placeholder: "Acme Corp" },
              { key: "orgId",      label: "Organization ID (Login Slug)", type: "text", placeholder: "acme-corp" },
              { key: "adminName",  label: "Your Name",         type: "text",     placeholder: "John Doe" },
              { key: "email",      label: "Admin Email",       type: "email",    placeholder: "admin@acme.com" },
              { key: "password",   label: "Password",          type: "password", placeholder: "••••••••" },
            ].map(({ key, label, type, placeholder }) => (
              <div key={key}>
                <label className="block text-[11px] font-medium mb-1" style={{ color: "var(--text-secondary)" }}>{label}</label>
                <input
                  type={type} required value={form[key as keyof typeof form]} onChange={set(key)}
                  placeholder={placeholder}
                  className="w-full px-3 py-2 rounded border text-[12px] outline-none focus:border-blue-600"
                  style={{ background: "var(--bg-elevated)", borderColor: "var(--border)", color: "var(--text-primary)" }}
                />
              </div>
            ))}
            <button
              type="submit" disabled={loading}
              className="w-full py-2 rounded text-[13px] font-medium transition-opacity hover:opacity-90 disabled:opacity-50 mt-1"
              style={{ background: "var(--accent)", color: "#fff" }}
            >
              {loading ? "Creating…" : "Create Organization"}
            </button>
          </form>

          <p className="text-[11px] mt-4 text-center" style={{ color: "var(--text-muted)" }}>
            Already have an account?{" "}
            <Link href="/login" className="text-blue-400 hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
