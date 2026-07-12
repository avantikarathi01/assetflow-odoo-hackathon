"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { apiFetch } from "@/lib/api";
import { Package } from "lucide-react";
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

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: "var(--bg-base)" }}>
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex items-center gap-2 mb-8 justify-center">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
            <Package size={16} className="text-white" />
          </div>
          <span className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>AssetFlow</span>
        </div>

        <div className="rounded-lg border p-6" style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}>
          <h1 className="text-[14px] font-semibold mb-1" style={{ color: "var(--text-primary)" }}>Sign in to your account</h1>
          <p className="text-[12px] mb-5" style={{ color: "var(--text-secondary)" }}>Enterprise Asset Management Platform</p>

          {error && (
            <div className="mb-4 px-3 py-2 rounded border text-[12px]" style={{ background: "var(--danger)", borderColor: "var(--danger)", color: "#fff", opacity: 0.9 }}>
              {error}
            </div>
          )}

          {/* Hackathon Demo Roles */}
          <div className="mb-4 space-y-2 pb-4 border-b" style={{ borderColor: "var(--border)" }}>
            <p className="text-[11px] font-medium" style={{ color: "var(--text-secondary)" }}>Quick Login (Demo Roles):</p>
            <div className="flex gap-2">
              <button 
                type="button" 
                onClick={() => { setEmail(`admin@${organizationSlug || 'acme-corp'}.com`); setPassword("Password123!"); }}
                className="flex-1 py-1 rounded border text-[11px] hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                style={{ borderColor: "var(--border)", color: "var(--text-primary)" }}
              >
                Admin
              </button>
              <button 
                type="button" 
                onClick={() => { setEmail(`manager@${organizationSlug || 'acme-corp'}.com`); setPassword("Password123!"); }}
                className="flex-1 py-1 rounded border text-[11px] hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                style={{ borderColor: "var(--border)", color: "var(--text-primary)" }}
              >
                Manager
              </button>
              <button 
                type="button" 
                onClick={() => { setEmail(`employee@${organizationSlug || 'acme-corp'}.com`); setPassword("Password123!"); }}
                className="flex-1 py-1 rounded border text-[11px] hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                style={{ borderColor: "var(--border)", color: "var(--text-primary)" }}
              >
                Employee
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-[11px] font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Organization ID</label>
              <input
                type="text" required value={organizationSlug} onChange={(e) => setOrganizationSlug(e.target.value)}
                placeholder="acme-corp"
                className="w-full px-3 py-2 rounded border text-[12px] outline-none focus:border-blue-600"
                style={{ background: "var(--bg-elevated)", borderColor: "var(--border)", color: "var(--text-primary)" }}
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Email</label>
              <input
                type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@company.com"
                className="w-full px-3 py-2 rounded border text-[12px] outline-none focus:border-blue-600"
                style={{ background: "var(--bg-elevated)", borderColor: "var(--border)", color: "var(--text-primary)" }}
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Password</label>
              <input
                type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-2 rounded border text-[12px] outline-none focus:border-blue-600"
                style={{ background: "var(--bg-elevated)", borderColor: "var(--border)", color: "var(--text-primary)" }}
              />
            </div>
            <button
              type="submit" disabled={loading}
              className="w-full py-2 rounded text-[13px] font-medium transition-opacity hover:opacity-90 disabled:opacity-50 mt-1"
              style={{ background: "var(--accent)", color: "#fff" }}
            >
              {loading ? "Signing in…" : "Sign In"}
            </button>
          </form>

          <p className="text-[11px] mt-4 text-center" style={{ color: "var(--text-muted)" }}>
            New organization?{" "}
            <Link href="/register" className="text-blue-400 hover:underline">Register here</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
