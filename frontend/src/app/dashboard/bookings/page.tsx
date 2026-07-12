"use client";
import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { PageHeader } from "@/components/ui/PageHeader";
import { Modal, FormField, Input, SelectField, Btn } from "@/components/ui/Modal";
import { EmptyState } from "@/components/ui/EmptyState";
import { Spinner } from "@/components/ui/Spinner";
import { CalendarDays, Clock, MapPin } from "lucide-react";

export default function BookingsPage() {
  const { user } = useAuth();
  const [resources, setResources] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  
  const [selectedResource, setSelectedResource] = useState("");
  const [modal, setModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [form, setForm] = useState({
    startAt: "", endAt: "", purpose: ""
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setInitialLoading(true);
    try {
      const [res, bks] = await Promise.all([
        apiFetch("/bookings/resources"),
        apiFetch("/bookings")
      ]);
      setResources(res);
      setBookings(bks);
    } catch (e) {
      console.error(e);
    } finally {
      setInitialLoading(false);
    }
  };

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setSuccess(""); setSaving(true);
    try {
      await apiFetch("/bookings", { 
        method: "POST", 
        body: JSON.stringify({ ...form, resourceId: selectedResource }) 
      });
      setSuccess("Booking created successfully!");
      setModal(false);
      fetchData();
    } catch (err: any) {
      setError(err.message || "Failed to book slot");
    } finally {
      setSaving(false);
    }
  };

  const setF = (k: string) => (e: any) => setForm((f) => ({ ...f, [k]: e.target.value }));

  // Filter bookings for selected resource today
  const resourceBookings = bookings.filter(b => b.resourceId === selectedResource);

  return (
    <div className="animate-fade-in max-w-4xl">
      <PageHeader 
        title="Resource Booking" 
        subtitle="Reserve shared spaces, vehicles, and equipment with overlap prevention."
        actions={
          selectedResource ? (
            <Btn onClick={() => { setForm({ startAt:"", endAt:"", purpose:"" }); setModal(true); }}>
              Book Slot
            </Btn>
          ) : undefined
        }
      />

      {initialLoading ? (
        <Spinner />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1 space-y-4">
            <h2 className="text-[14px] font-semibold tracking-wide" style={{ color: "var(--text-primary)" }}>Available Resources</h2>
            <div className="space-y-3">
              {resources.map(r => (
                <div 
                  key={r.id} 
                  onClick={() => setSelectedResource(r.id)}
                  className={`p-4 rounded-xl cursor-pointer transition-all duration-200 border ${selectedResource === r.id ? 'bg-blue-600/10 border-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.15)]' : 'glass hover:bg-white/5 border-[rgba(255,255,255,0.05)]'}`}
                >
                  <h3 className="font-medium text-[14px] mb-1" style={{ color: "var(--text-primary)" }}>{r.name}</h3>
                  <div className="flex items-center gap-1 text-[11px]" style={{ color: "var(--text-secondary)" }}>
                    <MapPin size={12} /> {r.location?.name || "Main Office"}
                  </div>
                </div>
              ))}
              {resources.length === 0 && <p className="text-[12px] text-slate-500">No resources available.</p>}
            </div>
          </div>

          <div className="md:col-span-2">
            {selectedResource ? (
              <div className="glass-card rounded-xl p-6 min-h-[400px]">
                <h2 className="text-[16px] font-semibold tracking-wide mb-6 pb-4 border-b border-[rgba(255,255,255,0.05)]" style={{ color: "var(--text-primary)" }}>
                  Booking Schedule
                </h2>

                <div className="space-y-4">
                  {resourceBookings.length === 0 ? (
                    <EmptyState 
                      icon={CalendarDays} 
                      title="No Bookings Yet" 
                      description="This resource is completely free today. You can book a slot using the button above." 
                    />
                  ) : (
                    resourceBookings.map(b => {
                      const start = new Date(b.startAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' });
                      const end = new Date(b.endAt).toLocaleTimeString([], { timeStyle: 'short' });
                      return (
                        <div key={b.id} className="flex gap-4 p-4 rounded-lg bg-black/20 border border-[rgba(255,255,255,0.05)]">
                          <div className="flex flex-col items-center justify-center px-4 border-r border-[rgba(255,255,255,0.05)] min-w-[120px]">
                            <Clock size={16} className="text-blue-400 mb-1.5" />
                            <span className="text-[11px] font-medium text-slate-300">{start}</span>
                            <span className="text-[10px] text-slate-500">to {end}</span>
                          </div>
                          <div className="flex-1">
                            <p className="text-[13px] font-medium mb-1" style={{ color: "var(--text-primary)" }}>{b.purpose}</p>
                            <p className="text-[12px]" style={{ color: "var(--text-secondary)" }}>Booked by {b.bookedBy?.firstName} {b.bookedBy?.lastName}</p>
                            <span className={`inline-block mt-2 px-2 py-0.5 rounded border text-[9px] font-medium tracking-wide ${
                              b.status === 'CONFIRMED' ? 'border-green-500/30 text-green-400 bg-green-500/10' :
                              b.status === 'CANCELLED' ? 'border-red-500/30 text-red-400 bg-red-500/10' :
                              'border-blue-500/30 text-blue-400 bg-blue-500/10'
                            }`}>
                              {b.status}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full min-h-[400px]">
                <EmptyState 
                  icon={CalendarDays} 
                  title="Select a Resource" 
                  description="Choose a resource from the list to view its schedule and book a slot." 
                />
              </div>
            )}
          </div>
        </div>
      )}

      <Modal open={modal} onClose={() => setModal(false)} title="Book Resource">
        <form onSubmit={handleBooking} className="space-y-4">
          {error && <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-lg">{error}</div>}
          
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Start Time">
              <Input type="datetime-local" required value={form.startAt} onChange={setF("startAt")} />
            </FormField>
            <FormField label="End Time">
              <Input type="datetime-local" required value={form.endAt} onChange={setF("endAt")} />
            </FormField>
          </div>
          
          <FormField label="Purpose of Booking">
            <Input required value={form.purpose} onChange={setF("purpose")} placeholder="Client meeting..." />
          </FormField>
          
          <div className="flex justify-end gap-3 pt-4 border-t border-[rgba(255,255,255,0.05)]">
            <Btn variant="ghost" type="button" onClick={() => setModal(false)}>Cancel</Btn>
            <Btn type="submit" disabled={saving}>{saving ? "Booking..." : "Confirm Booking"}</Btn>
          </div>
        </form>
      </Modal>
    </div>
  );
}
