"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { Package, ArrowRight, CheckCircle, Shield, Info } from "lucide-react";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ orgName: "", orgId: "", adminName: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

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
          password: form.password,
        }),
      });
      setSuccess(true);
      setTimeout(() => router.push("/"), 2500);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const fields = [
    { key: "orgName", label: "Organization Name", type: "text", placeholder: "Acme Corp" },
    { key: "orgId", label: "Organization ID (Login Slug)", type: "text", placeholder: "acme-corp" },
    { key: "adminName", label: "Your Full Name (Admin)", type: "text", placeholder: "John Doe" },
    { key: "email", label: "Admin Email", type: "email", placeholder: "admin@acme-corp.com" },
    { key: "password", label: "Password", type: "password", placeholder: "••••••••" },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden" style={{ background: "var(--bg-base)" }}>
      {/* Ambient blurs */}
      <div className="absolute w-[500px] h-[500px] rounded-full blur-[120px] -top-40 -left-40 opacity-40 pointer-events-none" style={{ background: "var(--accent-glow)" }} />
      <div className="absolute w-[400px] h-[400px] rounded-full blur-[100px] bottom-0 -right-20 opacity-30 pointer-events-none" style={{ background: "var(--info)", opacity: 0.1 }} />

      <div className="w-full max-w-[480px] relative z-10 animate-scale-in">
        {/* Logo */}
        <div className="flex flex-col items-center gap-3 mb-8 justify-center">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg" style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-hover))" }}>
            <Package size={24} className="text-white" />
          </div>
          <span className="text-2xl font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>AssetFlow</span>
        </div>

        <div className="glass-card rounded-2xl p-7 sm:p-9 border shadow-xl" style={{ animationName: "none", borderColor: "var(--border-subtle)", background: "var(--bg-surface)" }}>
          {success ? (
            <div className="text-center py-8 animate-scale-in">
              <div className="w-16 h-16 rounded-full border flex items-center justify-center mx-auto mb-5" style={{ background: "var(--success-glow)", borderColor: "var(--success)", color: "var(--success)" }}>
                <CheckCircle size={32} />
              </div>
              <h2 className="text-[20px] font-bold mb-2" style={{ color: "var(--text-primary)" }}>Workspace Created!</h2>
              <p className="text-[14px] mb-2" style={{ color: "var(--text-secondary)" }}>Your organization and admin account are ready.</p>
              <p className="text-[13px] font-medium" style={{ color: "var(--accent)" }}>Redirecting to login…</p>
            </div>
          ) : (
            <>
              <h1 className="text-[20px] font-bold mb-1.5" style={{ color: "var(--text-primary)" }}>Create Organization Workspace</h1>
              <p className="text-[14px] mb-6" style={{ color: "var(--text-secondary)" }}>Register a new workspace. You will automatically become the <strong style={{ color: "var(--accent)" }}>ADMIN</strong>.</p>

              {error && (
                <div className="mb-6 px-4 py-3 rounded-xl text-[13px] font-medium border flex items-center gap-2" style={{ background: "var(--danger-glow)", borderColor: "var(--danger)", color: "var(--danger)" }}>
                  <span className="shrink-0">⚠️</span> {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {fields.map(({ key, label, type, placeholder }) => (
                  <div key={key}>
                    <label className="block text-[13px] font-bold mb-2 tracking-wide" style={{ color: "var(--text-primary)" }}>{label}</label>
                    <input
                      type={type}
                      required
                      value={form[key as keyof typeof form]}
                      onChange={set(key)}
                      placeholder={placeholder}
                      className="w-full px-4 py-3 rounded-xl border text-[14px] outline-none transition-all focus:ring-2 focus:ring-[var(--accent)]/30 focus:border-[var(--accent)]"
                      style={{ borderColor: "var(--border)", color: "var(--text-primary)", background: "var(--bg-elevated)" }}
                    />
                  </div>
                ))}

                <button type="submit" disabled={loading} className="w-full py-3.5 rounded-xl text-[14px] font-bold btn-primary transition-all hover:scale-[1.02] shadow-lg flex items-center justify-center gap-2 mt-4 disabled:opacity-70 disabled:hover:scale-100">
                  {loading ? "Provisioning Database…" : <><Shield size={16} /> Create Organization & Admin</>}
                </button>
              </form>

              <div className="mt-8 pt-6 border-t" style={{ borderColor: "var(--border-subtle)" }}>
                <div className="flex items-start gap-3 p-4 rounded-xl border" style={{ background: "var(--info)", opacity: 0.9, borderColor: "rgba(79,70,229,0.2)" }}>
                  <Info size={18} className="text-white shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-[13px] font-bold text-white mb-1">RBAC Demo Pre-loaded</h4>
                    <p className="text-[12px] text-white/90 leading-relaxed">
                      For hackathon evaluation, this registration automatically creates 3 demo accounts (Admin, Manager, Employee) for your org so you can instantly test the distinct Role-Based Access portals!
                    </p>
                  </div>
                </div>
              </div>

              <p className="text-[13px] mt-6 text-center font-medium" style={{ color: "var(--text-secondary)" }}>
                Already have an account?{" "}
                <Link href="/" className="font-bold hover:underline transition-all" style={{ color: "var(--accent)" }}>Sign in</Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
