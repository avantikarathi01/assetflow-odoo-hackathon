"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import {
  LayoutDashboard, Building2, Package, ArrowLeftRight,
  CalendarDays, Wrench, ClipboardCheck, BarChart2, Bell, LogOut,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";

const NAV = [
  { href: "/dashboard",              label: "Dashboard",         icon: LayoutDashboard, roles: ['ADMIN', 'MANAGER', 'EMPLOYEE'] },
  { href: "/dashboard/organization", label: "Organization setup",icon: Building2,       roles: ['ADMIN'] },
  { href: "/dashboard/assets",       label: "Assets",            icon: Package,         roles: ['ADMIN', 'MANAGER', 'EMPLOYEE'] },
  { href: "/dashboard/allocations",  label: "Allocation & Transfer", icon: ArrowLeftRight, roles: ['ADMIN', 'MANAGER', 'EMPLOYEE'] },
  { href: "/dashboard/bookings",     label: "Resource Booking",  icon: CalendarDays,    roles: ['ADMIN', 'MANAGER', 'EMPLOYEE'] },
  { href: "/dashboard/maintenance",  label: "Maintenance",       icon: Wrench,          roles: ['ADMIN', 'MANAGER', 'EMPLOYEE'] },
  { href: "/dashboard/audit",        label: "Audit",             icon: ClipboardCheck,  roles: ['ADMIN', 'MANAGER'] },
  { href: "/dashboard/reports",      label: "Reports",           icon: BarChart2,       roles: ['ADMIN', 'MANAGER'] },
  { href: "/dashboard/activity",     label: "Notifications",     icon: Bell,            roles: ['ADMIN', 'MANAGER', 'EMPLOYEE'] },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <aside className="flex flex-col w-56 shrink-0 h-screen sticky top-0 glass border-r-0 border-r-[rgba(255,255,255,0.05)] shadow-xl z-10">
      {/* Logo */}
      <div className="px-5 py-6 flex flex-col justify-center border-b" style={{ borderColor: "var(--border-subtle)" }}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-[0_0_15px_rgba(59,130,246,0.5)]">
            <Package size={16} className="text-white" />
          </div>
          <span className="text-[16px] font-bold tracking-wide" style={{ color: "var(--text-primary)" }}>AssetFlow</span>
        </div>
        {user && (
          <div className="mt-4 flex flex-col">
            <span className="text-[10px] uppercase font-bold text-blue-400 tracking-wider">{user.roles[0]}</span>
            <span className="text-[12px] truncate" style={{ color: "var(--text-secondary)" }}>{user.email}</span>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
        {NAV.filter(({ roles }) => {
          if (!roles || !user?.roles) return true;
          return roles.some(r => user.roles.includes(r));
        }).map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={clsx(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-all duration-200 group relative",
                active
                  ? "bg-blue-600/15 text-blue-400 shadow-[inset_4px_0_0_var(--accent)]"
                  : "hover:bg-white/5"
              )}
              style={active ? {} : { color: "var(--text-secondary)" }}
            >
              <Icon size={16} className={clsx("transition-transform group-hover:scale-110 duration-200", active ? "text-blue-400" : "text-slate-400")} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t" style={{ borderColor: "var(--border-subtle)" }}>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 w-full rounded-lg text-[13px] font-medium hover:bg-white/5 transition-colors text-red-400/80 hover:text-red-400"
        >
          <LogOut size={16} />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
