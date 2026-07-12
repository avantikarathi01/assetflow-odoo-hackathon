"use client";
import { useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { FilterBar, Select } from "@/components/ui/FilterBar";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Modal, FormField, Input, SelectField, Btn } from "@/components/ui/Modal";
import { apiFetch } from "@/lib/api";
import { Plus } from "lucide-react";

// TODO: map to backend API
const MOCK_RESOURCES = [
  { id: "r1", name: "Conference Room A", type: "ROOM",      capacity: 12 },
  { id: "r2", name: "Conference Room B", type: "ROOM",      capacity: 8 },
  { id: "r3", name: "Projector Cart 1",  type: "EQUIPMENT", capacity: 1 },
  { id: "r4", name: "Training Lab",      type: "ROOM",      capacity: 20 },
];

const MOCK_BOOKINGS = [
  { id: "1", resource: "Conference Room A", bookedBy: "John Doe",   start: "2025-01-22 09:00", end: "2025-01-22 11:00", status: "CONFIRMED",  purpose: "Sprint Planning" },
  { id: "2", resource: "Conference Room B", bookedBy: "Sarah Kim",  start: "2025-01-22 14:00", end: "2025-01-22 15:00", status: "HELD",       purpose: "1:1 Meeting" },
  { id: "3", resource: "Projector Cart 1",  bookedBy: "Mike Chen",  start: "2025-01-23 10:00", end: "2025-01-23 12:00", status: "CONFIRMED",  purpose: "Client Demo" },
  { id: "4", resource: "Training Lab",      bookedBy: "Lisa Park",  start: "2025-01-20 09:00", end: "2025-01-20 17:00", status: "COMPLETED",  purpose: "Onboarding" },
  { id: "5", resource: "Conference Room A", bookedBy: "Bob Smith",  start: "2025-01-19 13:00", end: "2025-01-19 14:00", status: "CANCELLED",  purpose: "Budget Review" },
];

const STATUS_OPTS = [
  { value: "", label: "All Statuses" },
  { value: "HELD", label: "Held" },
  { value: "CONFIRMED", label: "Confirmed" },
  { value: "CHECKED_IN", label: "Checked In" },
  { value: "COMPLETED", label: "Completed" },
  { value: "CANCELLED", label: "Cancelled" },
];

export default function BookingsPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [modal, setModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ resourceId: "", startAt: "", endAt: "", purpose: "" });

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const filtered = MOCK_BOOKINGS.filter((b) => {
    const q = search.toLowerCase();
    return (!q || b.resource.toLowerCase().includes(q) || b.bookedBy.toLowerCase().includes(q))
      && (!statusFilter || b.status === statusFilter);
  });

  const handleBook = async (e: React.FormEvent) => {
    e.preventDefault(); setError(""); setSaving(true);
    try {
      await apiFetch("/bookings", { method: "POST", body: JSON.stringify(form) });
      setModal(false);
    } catch (err: unknown) { setError(err instanceof Error ? err.message : "Failed"); }
    finally { setSaving(false); }
  };

  return (
    <div>
      <PageHeader
        title="Resource Booking"
        subtitle="Shared rooms and equipment scheduling"
        actions={<Btn onClick={() => setModal(true)}><Plus size={12} className="inline mr-1" />New Booking</Btn>}
      />

      {/* Resource availability summary */}
      <div className="grid grid-cols-4 gap-3 mb-5">
        {MOCK_RESOURCES.map((r) => (
          <div key={r.id} className="rounded-lg border p-3" style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}>
            <p className="text-[12px] font-medium" style={{ color: "var(--text-primary)" }}>{r.name}</p>
            <p className="text-[11px] mt-0.5" style={{ color: "var(--text-muted)" }}>{r.type} · Cap: {r.capacity}</p>
            <div className="mt-2">
              <span className="inline-flex items-center gap-1 text-[11px] px-1.5 py-0.5 rounded" style={{ background: "var(--bg-elevated)", color: "var(--text-secondary)" }}>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                Available
              </span>
            </div>
          </div>
        ))}
      </div>

      <FilterBar search={search} onSearch={setSearch} placeholder="Search resource or user…">
        <Select value={statusFilter} onChange={setStatusFilter} options={STATUS_OPTS} />
      </FilterBar>

      <div className="rounded-lg border overflow-hidden" style={{ borderColor: "var(--border)" }}>
        <table className="w-full text-[12px]">
          <thead>
            <tr style={{ background: "var(--bg-elevated)", borderBottom: "1px solid var(--border)" }}>
              {["Resource", "Booked By", "Start", "End", "Purpose", "Status", "Actions"].map((h) => (
                <th key={h} className="text-left px-3 py-2.5 font-semibold" style={{ color: "var(--text-secondary)" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((b, i) => (
              <tr key={b.id} className="border-t" style={{ borderColor: "var(--border-subtle)", background: i % 2 === 0 ? "var(--bg-surface)" : "var(--bg-base)" }}>
                <td className="px-3 py-2.5 font-medium" style={{ color: "var(--text-primary)" }}>{b.resource}</td>
                <td className="px-3 py-2.5" style={{ color: "var(--text-secondary)" }}>{b.bookedBy}</td>
                <td className="px-3 py-2.5 font-mono text-[11px]" style={{ color: "var(--text-secondary)" }}>{b.start}</td>
                <td className="px-3 py-2.5 font-mono text-[11px]" style={{ color: "var(--text-secondary)" }}>{b.end}</td>
                <td className="px-3 py-2.5" style={{ color: "var(--text-secondary)" }}>{b.purpose}</td>
                <td className="px-3 py-2.5"><StatusBadge status={b.status} /></td>
                <td className="px-3 py-2.5">
                  {b.status === "HELD" && (
                    <button className="text-[11px] px-2 py-1 rounded border hover:opacity-80" style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}>
                      Confirm
                    </button>
                  )}
                  {b.status === "CONFIRMED" && (
                    <button className="text-[11px] px-2 py-1 rounded border hover:opacity-80" style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}>
                      Check In
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={modal} onClose={() => setModal(false)} title="New Resource Booking">
        <form onSubmit={handleBook} className="space-y-3">
          {error && <p className="text-[12px] text-red-400">{error}</p>}
          <FormField label="Resource">
            <SelectField required value={form.resourceId} onChange={set("resourceId")}>
              <option value="">Select resource…</option>
              {MOCK_RESOURCES.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
            </SelectField>
          </FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Start"><Input required type="datetime-local" value={form.startAt} onChange={set("startAt")} /></FormField>
            <FormField label="End"><Input required type="datetime-local" value={form.endAt} onChange={set("endAt")} /></FormField>
          </div>
          <FormField label="Purpose"><Input value={form.purpose} onChange={set("purpose")} placeholder="Sprint Planning" /></FormField>
          <div className="flex justify-end gap-2 pt-1">
            <Btn variant="ghost" type="button" onClick={() => setModal(false)}>Cancel</Btn>
            <Btn type="submit" disabled={saving}>{saving ? "Booking…" : "Book Resource"}</Btn>
          </div>
        </form>
      </Modal>
    </div>
  );
}
