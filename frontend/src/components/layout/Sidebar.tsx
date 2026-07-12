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
  { href: "/dashboard",              label: "Dashboard",         icon: LayoutDashboard },
  { href: "/dashboard/organization", label: "Organization",      icon: Building2 },
  { href: "/dashboard/assets",       label: "Assets",            icon: Package },
  { href: "/dashboard/allocations",  label: "Allocation / Transfer", icon: ArrowLeftRight },
  { href: "/dashboard/bookings",     label: "Resource Booking",  icon: CalendarDays },
  { href: "/dashboard/maintenance",  label: "Maintenance",       icon: Wrench },
  { href: "/dashboard/audit",        label: "Audit",             icon: ClipboardCheck },
  { href: "/dashboard/reports",      label: "Reports",           icon: BarChart2 },
  { href: "/dashboard/activity",     label: "Activity & Logs",   icon: Bell },
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
    <aside
      className="flex flex-col w-52 shrink-0 h-screen sticky top-0 border-r"
      style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}
    >
      {/* Logo */}
      <div className="px-4 py-4 border-b" style={{ borderColor: "var(--border)" }}>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-blue-600 flex items-center justify-center">
            <Package size={13} className="text-white" />
          </div>
          <span className="text-[13px] font-bold" style={{ color: "var(--text-primary)" }}>AssetFlow</span>
        </div>
        {user && (
          <p className="text-[10px] mt-1.5 truncate" style={{ color: "var(--text-muted)" }}>
            {user.email}
          </p>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-2">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={clsx(
                "flex items-center gap-2.5 px-3 py-2 mx-1.5 rounded text-[12px] transition-colors",
                active
                  ? "bg-blue-600/20 text-blue-400 font-medium"
                  : "hover:bg-white/5"
              )}
              style={active ? {} : { color: "var(--text-secondary)" }}
            >
              <Icon size={14} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-2 border-t" style={{ borderColor: "var(--border)" }}>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2.5 px-3 py-2 w-full rounded text-[12px] hover:bg-white/5 transition-colors"
          style={{ color: "var(--text-secondary)" }}
        >
          <LogOut size={14} />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
