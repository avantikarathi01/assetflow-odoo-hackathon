"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { apiFetch } from "@/lib/api";
import { Package, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [organizationSlug, setOrganizationSlug] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await apiFetch("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password, organizationSlug }),
      });
      login(res.data.token, res.data.user);
      router.push("/dashboard");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (role: string) => {
    const slug = organizationSlug || "acme-corp";
    setOrganizationSlug(slug);
    setEmail(`${role}@${slug}.com`);
    setPassword("Password123!");
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden" style={{ background: "var(--bg-base)" }}>
      {/* Ambient blurs */}
      <div className="absolute w-[500px] h-[500px] rounded-full bg-blue-600/[0.06] blur-[120px] -top-40 -right-40" />
      <div className="absolute w-[400px] h-[400px] rounded-full bg-indigo-500/[0.05] blur-[100px] bottom-0 -left-20" />

      <div className="w-full max-w-[420px] relative z-10 animate-scale-in">
        {/* Logo */}
        <div className="flex items-center gap-3 mb-8 justify-center">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-[0_0_20px_rgba(59,130,246,0.4)]">
            <Package size={20} className="text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight text-white">AssetFlow</span>
        </div>

        <div className="glass-card rounded-2xl p-6 sm:p-8" style={{ animationName: "none" }}>
          <h1 className="text-[18px] font-bold mb-1 text-white">Welcome back</h1>
          <p className="text-[13px] mb-6" style={{ color: "var(--text-secondary)" }}>Sign in to your workspace</p>

          {error && (
            <div className="mb-5 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-[13px]">
              ⚠️ {error}
            </div>
          )}

          {/* Quick Demo Roles */}
          <div className="mb-6 pb-5 border-b" style={{ borderColor: "var(--border-subtle)" }}>
            <p className="text-[11px] font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--text-muted)" }}>Quick Demo Login</p>
            <div className="grid grid-cols-3 gap-2">
              {["admin", "manager", "employee"].map((role) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => fillDemo(role)}
                  className="py-2 px-3 rounded-lg border text-[12px] font-medium capitalize transition-all duration-200 hover:bg-blue-500/10 hover:border-blue-500/30 hover:text-blue-400"
                  style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}
                >
                  {role}
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[12px] font-medium mb-2 tracking-wide" style={{ color: "var(--text-secondary)" }}>Organization ID</label>
              <input type="text" required value={organizationSlug} onChange={(e) => setOrganizationSlug(e.target.value)} placeholder="acme-corp" className="glass-input" />
            </div>
            <div>
              <label className="block text-[12px] font-medium mb-2 tracking-wide" style={{ color: "var(--text-secondary)" }}>Email</label>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@acme-corp.com" className="glass-input" />
            </div>
            <div>
              <label className="block text-[12px] font-medium mb-2 tracking-wide" style={{ color: "var(--text-secondary)" }}>Password</label>
              <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="glass-input" />
            </div>

            <button type="submit" disabled={loading} className="w-full py-3 rounded-xl text-[14px] font-semibold btn-primary disabled:opacity-50 mt-2">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                  Signing in…
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">Sign In <ArrowRight size={16} /></span>
              )}
            </button>
          </form>

          <p className="text-[12px] mt-6 text-center" style={{ color: "var(--text-muted)" }}>
            New organization?{" "}
            <Link href="/register" className="text-blue-400 hover:text-blue-300 font-medium transition-colors">Register here</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
