"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import {
  LayoutDashboard, Building2, Package, ArrowLeftRight,
  CalendarDays, Wrench, ClipboardCheck, BarChart2, Bell, LogOut,
  Moon, Sun, Shield, Building, UserCircle2,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { primaryRole, roleNames } from "@/lib/roles";
import { useTheme } from "@/lib/theme-context";
import { useRouter } from "next/navigation";

const NAV = [
  { href: "/dashboard",              label: "Dashboard",             icon: LayoutDashboard, roles: ['ADMIN', 'MANAGER', 'EMPLOYEE'] },
  { href: "/dashboard/organization", label: "Organization Setup",    icon: Building2,       roles: ['ADMIN'] },
  { href: "/dashboard/assets",       label: "Assets",                icon: Package,         roles: ['ADMIN', 'MANAGER', 'EMPLOYEE'] },
  { href: "/dashboard/allocations",  label: "Allocation & Transfer", icon: ArrowLeftRight,  roles: ['ADMIN', 'MANAGER', 'EMPLOYEE'] },
  { href: "/dashboard/bookings",     label: "Resource Booking",      icon: CalendarDays,    roles: ['ADMIN', 'MANAGER', 'EMPLOYEE'] },
  { href: "/dashboard/maintenance",  label: "Maintenance",           icon: Wrench,          roles: ['ADMIN', 'MANAGER', 'EMPLOYEE'] },
  { href: "/dashboard/audit",        label: "Audit",                 icon: ClipboardCheck,  roles: ['ADMIN', 'MANAGER'] },
  { href: "/dashboard/reports",      label: "Reports",               icon: BarChart2,       roles: ['ADMIN', 'MANAGER'] },
  { href: "/dashboard/activity",     label: "Notifications",         icon: Bell,            roles: ['ADMIN', 'MANAGER', 'EMPLOYEE'] },
];

const ROLE_META: Record<string, { label: string; color: string; bg: string; Icon: any }> = {
  ADMIN: {
    label: "Administrator",
    color: "text-purple-700 dark:text-purple-300",
    bg: "bg-purple-500/10 border-purple-500/20",
    Icon: Shield,
  },
  MANAGER: {
    label: "Manager",
    color: "text-blue-700 dark:text-blue-300",
    bg: "bg-blue-500/10 border-blue-500/20",
    Icon: Building,
  },
  EMPLOYEE: {
    label: "Employee",
    color: "text-teal-700 dark:text-teal-300",
    bg: "bg-teal-500/10 border-teal-500/20",
    Icon: UserCircle2,
  },
};

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();
  const userRoles = roleNames(user?.roles);
  const role = primaryRole(user?.roles);
  const roleMeta = ROLE_META[role] ?? ROLE_META.EMPLOYEE;

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <aside className="flex flex-col w-60 shrink-0 h-screen sticky top-0 border-r shadow-xl z-10" style={{ background: "var(--bg-surface)", borderColor: "var(--border-subtle)" }}>
      {/* Logo */}
      <div className="px-5 py-5 flex flex-col justify-center border-b" style={{ borderColor: "var(--border-subtle)" }}>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shadow-sm" style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-hover))" }}>
            <Package size={18} className="text-white" />
          </div>
          <span className="text-[17px] font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>AssetFlow</span>
        </div>
        {user && (
          <div className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border ${roleMeta.bg}`}>
            <roleMeta.Icon size={16} className={roleMeta.color} />
            <div className="min-w-0">
              <div className={`text-[11px] font-bold uppercase tracking-wider ${roleMeta.color}`}>{roleMeta.label}</div>
              <div className="text-[12px] truncate font-medium" style={{ color: "var(--text-secondary)" }}>{user.email}</div>
            </div>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-2.5 space-y-0.5">
        {NAV.filter(({ roles }) => {
          if (!roles || !userRoles.length) return true;
          return roles.some(r => userRoles.includes(r));
        }).map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={clsx(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-semibold transition-all duration-200 group relative",
                active
                  ? "shadow-[inset_3px_0_0_var(--accent)]"
                  : "hover:bg-slate-500/8"
              )}
              style={active
                ? { background: "var(--accent-glow)", color: "var(--accent)" }
                : { color: "var(--text-secondary)" }
              }
            >
              <Icon size={17} className="shrink-0 transition-transform group-hover:scale-110 duration-200" />
              <span className="truncate">{label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t space-y-0.5" style={{ borderColor: "var(--border-subtle)" }}>
        <button
          onClick={toggleTheme}
          className="mb-1 flex items-center gap-3 px-3 py-2.5 w-full rounded-xl text-[13px] font-semibold hover:bg-slate-500/10 transition-colors"
          style={{ color: "var(--text-secondary)" }}
        >
          {theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
          {theme === "dark" ? "Light Mode" : "Dark Mode"}
        </button>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 w-full rounded-xl text-[13px] font-semibold hover:bg-red-500/10 transition-colors"
          style={{ color: "var(--danger)" }}
        >
          <LogOut size={17} />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
