"use client";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { primaryRole } from "@/lib/roles";
import {
  AdminPortal,
  ManagerPortal,
  EmployeePortal,
  DashboardEvent,
  DashboardKpis,
  RecentActivity
} from "@/components/dashboard/Portals";

function dateKey(date: Date | string) {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [kpis, setKpis] = useState<DashboardKpis | null>(null);
  const [activity, setActivity] = useState<RecentActivity[]>([]);
  const [events, setEvents] = useState<DashboardEvent[]>([]);
  const [selectedDate, setSelectedDate] = useState(() => dateKey(new Date()));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch("/dashboard")
      .then((data) => {
        setKpis(data);
        setActivity(data.recentActivity || []);
        setEvents(data.upcomingEvents || []);
      })
      .catch(() => {
        // Graceful fallback
        setKpis({ totalAssets: 0, availableAssets: 0, allocatedAssets: 0, maintenanceToday: 0, activeBookings: 0, pendingTransfers: 0 });
      })
      .finally(() => setLoading(false));
  }, []);

  const role = primaryRole(user?.roles);

  const sharedProps = {
    kpis,
    activity,
    events,
    selectedDate,
    setSelectedDate,
    loading
  };

  if (role === "ADMIN") {
    return <AdminPortal {...sharedProps} />;
  }

  if (role === "MANAGER") {
    return <ManagerPortal {...sharedProps} />;
  }

  // Fallback to Employee (EMPLOYEE)
  return <EmployeePortal {...sharedProps} />;
}
