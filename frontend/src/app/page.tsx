"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { apiFetch } from "@/lib/api";
import Link from "next/link";
import {
  Package, Shield, CalendarDays,
  ArrowRight, ChevronRight, Zap, Building2, UserCircle2
} from "lucide-react";

/* ─── Floating Particle Dots ─── */
function Particles() {
  const dots = [
    { w: 6, x: "12%", y: "18%", cls: "bg-[var(--accent)]", dur: "7s", del: "0s" },
    { w: 4, x: "25%", y: "72%", cls: "bg-[var(--info)]", dur: "9s", del: "1s" },
    { w: 8, x: "70%", y: "25%", cls: "bg-[var(--accent)]", dur: "8s", del: "0.5s" },
    { w: 5, x: "80%", y: "65%", cls: "bg-[var(--info)]", dur: "10s", del: "2s" },
    { w: 3, x: "45%", y: "85%", cls: "bg-[var(--accent)]", dur: "6s", del: "1.5s" },
    { w: 7, x: "58%", y: "40%", cls: "bg-[var(--info)]", dur: "11s", del: "0.8s" },
  ];

  return (
    <>
      {dots.map((d, i) => (
        <div
          key={i}
          className={`absolute rounded-full opacity-30 ${d.cls}`}
          style={{
            width: d.w * 2,
            height: d.w * 2,
            left: d.x,
            top: d.y,
            animation: `float ${d.dur} ease-in-out ${d.del} infinite`,
          }}
        />
      ))}
    </>
  );
}

/* ─── Feature Card ─── */
function FeatureCard({ icon: Icon, title, desc, delay }: { icon: any; title: string; desc: string; delay: string }) {
  return (
    <div
      className="glass-card rounded-xl p-5 opacity-0 animate-slide-left group cursor-default shadow-sm border transition-all hover:-translate-y-1 hover:shadow-md"
      style={{ animationDelay: delay, animationFillMode: "forwards", borderColor: "var(--border-subtle)", background: "var(--bg-surface)" }}
    >
      <div className="flex items-start gap-4">
        <div className="p-3 rounded-xl transition-all shrink-0" style={{ background: "var(--accent-glow)", color: "var(--accent)" }}>
          <Icon size={20} />
        </div>
        <div>
          <h3 className="text-[15px] font-bold mb-1.5" style={{ color: "var(--text-primary)" }}>{title}</h3>
          <p className="text-[13px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>{desc}</p>
        </div>
      </div>
    </div>
  );
}

/* ─── Main Landing Page ─── */
export default function LandingPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [orgSlug, setOrgSlug] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await apiFetch("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password, organizationSlug: orgSlug }),
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
    const slug = orgSlug || "acme-corp";
    setOrgSlug(slug);
    setEmail(`${role}@${slug}.com`);
    setPassword("Password123!");
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[var(--bg-base)]">

      {/* ══════════════════════════════════════════
          LEFT HALF — Hero / Brand Panel
         ══════════════════════════════════════════ */}
      <div className="relative lg:w-1/2 flex flex-col justify-center px-8 sm:px-12 lg:px-20 py-16 overflow-hidden">
        {/* Ambient background Orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute w-[600px] h-[600px] rounded-full blur-[120px] -top-32 -left-32 animate-float-slow opacity-50" style={{ background: "var(--accent-glow)" }} />
          <div className="absolute w-[500px] h-[500px] rounded-full blur-[100px] bottom-10 -right-20 animate-float opacity-30" style={{ background: "var(--info)", opacity: 0.1 }} />
        </div>
        <Particles />

        {/* Content */}
        <div className="relative z-10 max-w-xl">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border mb-8 opacity-0 animate-slide-left shadow-sm" style={{ animationDelay: "0.1s", animationFillMode: "forwards", borderColor: "var(--accent)", background: "var(--accent-glow)" }}>
            <Zap size={14} style={{ color: "var(--accent)" }} />
            <span className="text-[12px] font-bold tracking-wider uppercase" style={{ color: "var(--accent)" }}>Next-Gen Asset Platform</span>
          </div>

          {/* Headline */}
          <h1 className="text-5xl sm:text-6xl font-extrabold leading-[1.1] mb-6 opacity-0 animate-slide-left tracking-tight" style={{ animationDelay: "0.2s", animationFillMode: "forwards", color: "var(--text-primary)" }}>
            <span className="bg-clip-text text-transparent bg-gradient-to-r" style={{ backgroundImage: "linear-gradient(to right, var(--text-primary), var(--accent))" }}>AssetFlow</span>
          </h1>
          <p className="text-xl sm:text-2xl font-semibold mb-4 opacity-0 animate-slide-left" style={{ animationDelay: "0.3s", animationFillMode: "forwards", color: "var(--text-primary)" }}>
            Enterprise Asset &amp; Resource Hub
          </p>
          <p className="text-[15px] leading-relaxed mb-12 opacity-0 animate-slide-left" style={{ animationDelay: "0.4s", animationFillMode: "forwards", color: "var(--text-secondary)" }}>
            Ditch the spreadsheets. Track physical assets, manage department allocations, schedule shared resources, and automate your entire maintenance lifecycle from one beautiful interface.
          </p>

          {/* Feature Cards */}
          <div className="space-y-4">
            <FeatureCard icon={Package} title="Full Asset Lifecycle" desc="Track assets from procurement to retirement. Maintain a verified chain-of-custody across departments." delay="0.5s" />
            <FeatureCard icon={Shield} title="Role-Based Workflows" desc="Distinct portals for Admins, Managers, and Employees. Deep isolation and strict operational governance." delay="0.65s" />
            <FeatureCard icon={CalendarDays} title="Resource Scheduling" desc="Check-out equipment or book shared spaces securely with intelligent conflict prevention." delay="0.8s" />
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════
          RIGHT HALF — Login Form
         ══════════════════════════════════════════ */}
      <div className="relative lg:w-1/2 flex items-center justify-center px-6 sm:px-12 py-16 border-l" style={{ borderColor: "var(--border-subtle)", background: "var(--bg-elevated)" }}>
        <div className="w-full max-w-[440px] opacity-0 animate-slide-right" style={{ animationDelay: "0.3s", animationFillMode: "forwards" }}>
          
          {/* Header */}
          <div className="flex items-center gap-4 mb-3">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-md" style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-hover))" }}>
              <Package size={24} className="text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>Welcome Back</h2>
              <p className="text-[14px]" style={{ color: "var(--text-secondary)" }}>Sign in to your organization workspace</p>
            </div>
          </div>

          {/* Login Card */}
          <div className="mt-8 rounded-2xl p-7 sm:p-9 shadow-xl border" style={{ background: "var(--bg-surface)", borderColor: "var(--border-subtle)" }}>
            {error && (
              <div className="mb-6 px-4 py-3 rounded-xl text-[13px] flex items-center gap-3 border" style={{ background: "var(--danger-glow)", borderColor: "var(--danger)", color: "var(--danger)" }}>
                <span className="shrink-0">⚠️</span> {error}
              </div>
            )}

            {/* Quick Demo Roles */}
            <div className="mb-8 pb-6 border-b" style={{ borderColor: "var(--border-subtle)" }}>
              <p className="text-[12px] font-bold uppercase tracking-wider mb-4" style={{ color: "var(--text-muted)" }}>Quick Demo Portals</p>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { id: "admin", icon: Shield, label: "Admin" },
                  { id: "manager", icon: Building2, label: "Manager" },
                  { id: "employee", icon: UserCircle2, label: "Employee" }
                ].map((role) => (
                  <button
                    key={role.id}
                    type="button"
                    onClick={() => fillDemo(role.id)}
                    className="flex flex-col items-center justify-center gap-2 py-3 px-2 rounded-xl border transition-all hover:-translate-y-1 hover:shadow-sm group"
                    style={{ borderColor: "var(--border)", background: "var(--bg-elevated)" }}
                  >
                    <role.icon size={18} className="transition-colors group-hover:scale-110" style={{ color: "var(--text-secondary)" }} />
                    <span className="text-[11px] font-bold tracking-wide uppercase" style={{ color: "var(--text-secondary)" }}>{role.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="block text-[13px] font-bold mb-2 tracking-wide" style={{ color: "var(--text-primary)" }}>Organization ID</label>
                <input
                  type="text"
                  required
                  value={orgSlug}
                  onChange={(e) => setOrgSlug(e.target.value)}
                  placeholder="acme-corp"
                  className="w-full px-4 py-3 rounded-xl border text-[14px] outline-none transition-all focus:ring-2 focus:ring-[var(--accent)]/30 focus:border-[var(--accent)]"
                  style={{ borderColor: "var(--border)", color: "var(--text-primary)", background: "var(--bg-elevated)" }}
                />
              </div>
              <div>
                <label className="block text-[13px] font-bold mb-2 tracking-wide" style={{ color: "var(--text-primary)" }}>Email Address</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full px-4 py-3 rounded-xl border text-[14px] outline-none transition-all focus:ring-2 focus:ring-[var(--accent)]/30 focus:border-[var(--accent)]"
                  style={{ borderColor: "var(--border)", color: "var(--text-primary)", background: "var(--bg-elevated)" }}
                />
              </div>
              <div>
                <label className="block text-[13px] font-bold mb-2 tracking-wide" style={{ color: "var(--text-primary)" }}>Password</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 rounded-xl border text-[14px] outline-none transition-all focus:ring-2 focus:ring-[var(--accent)]/30 focus:border-[var(--accent)]"
                  style={{ borderColor: "var(--border)", color: "var(--text-primary)", background: "var(--bg-elevated)" }}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl text-[14px] font-bold btn-primary transition-all hover:scale-[1.02] shadow-lg flex items-center justify-center gap-2 mt-2 disabled:opacity-70 disabled:hover:scale-100"
              >
                {loading ? "Authenticating..." : (
                  <>Sign In to Workspace <ArrowRight size={16} /></>
                )}
              </button>
            </form>

            <div className="mt-8 pt-6 border-t flex flex-col items-center" style={{ borderColor: "var(--border-subtle)" }}>
              <p className="text-[13px] font-medium mb-3" style={{ color: "var(--text-secondary)" }}>
                Don't have an organization yet?
              </p>
              <Link
                href="/register"
                className="w-full py-3.5 rounded-xl text-[13px] font-bold flex items-center justify-center gap-2 border transition-all hover:bg-slate-500/5 hover:-translate-y-0.5"
                style={{ borderColor: "var(--border)", color: "var(--text-primary)" }}
              >
                Register New Organization <ChevronRight size={16} />
              </Link>
            </div>
          </div>
          
          <div className="flex items-center justify-between mt-8 px-2 opacity-60">
            <p className="text-[11px] font-medium" style={{ color: "var(--text-secondary)" }}>© 2026 AssetFlow Inc.</p>
            <p className="text-[11px] font-medium" style={{ color: "var(--text-secondary)" }}>Built for Odoo Hackathon</p>
          </div>
        </div>
      </div>
    </div>
  );
}
