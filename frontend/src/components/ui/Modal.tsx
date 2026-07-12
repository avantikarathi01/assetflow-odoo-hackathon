"use client";
import { ReactNode, useEffect, useState } from "react";
import { X } from "lucide-react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  width?: string;
}
import { createPortal } from "react-dom";

export function Modal({ open, onClose, title, children, width = "max-w-lg" }: ModalProps) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!open || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 transition-opacity" style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)", animation: "fadeIn 0.2s ease-out forwards" }} onClick={onClose}>
      <style>{`@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }`}</style>
      <div
        className={`w-full ${width} rounded-2xl shadow-2xl glass-card border flex flex-col max-h-[90vh] animate-scale-in`}
        style={{ borderColor: "var(--border-subtle)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-5 border-b shrink-0" style={{ borderColor: "var(--border-subtle)", background: "var(--bg-hover)" }}>
          <h2 className="text-[16px] font-bold tracking-wide" style={{ color: "var(--text-primary)" }}>{title}</h2>
          <button onClick={onClose} className="rounded-full p-1.5 hover:bg-slate-500/10 transition-colors" style={{ color: "var(--text-secondary)" }}>
            <X size={16} />
          </button>
        </div>
        <div className="p-6 overflow-y-auto">{children}</div>
      </div>
    </div>,
    document.body
  );
}

export function FormField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="mb-4">
      <label className="block text-[12px] font-medium mb-1.5 tracking-wide" style={{ color: "var(--text-secondary)" }}>{label}</label>
      {children}
    </div>
  );
}

export function Input({ ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className="w-full px-4 py-2.5 rounded-xl border text-[14px] font-medium outline-none transition-all placeholder-slate-400 focus:ring-2 focus:ring-[var(--accent)]/30 focus:border-[var(--accent)]"
      style={{ borderColor: "var(--border)", color: "var(--text-primary)", background: "var(--bg-elevated)" }}
    />
  );
}

export function Textarea({ ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      rows={3}
      className="w-full px-4 py-2.5 rounded-xl border text-[14px] font-medium outline-none transition-all placeholder-slate-400 focus:ring-2 focus:ring-[var(--accent)]/30 focus:border-[var(--accent)] resize-none"
      style={{ borderColor: "var(--border)", color: "var(--text-primary)", background: "var(--bg-elevated)" }}
    />
  );
}

export function SelectField({ children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement> & { children: ReactNode }) {
  return (
    <select
      {...props}
      className="w-full px-4 py-2.5 rounded-xl border text-[14px] font-medium outline-none transition-all appearance-none cursor-pointer focus:ring-2 focus:ring-[var(--accent)]/30 focus:border-[var(--accent)]"
      style={{ borderColor: "var(--border)", color: "var(--text-primary)", backgroundColor: "var(--bg-elevated)" }}
    >
      {children}
    </select>
  );
}

export function Btn({ children, variant = "primary", ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "ghost" | "danger" }) {
  const baseClasses = "px-4 py-2 rounded-lg text-[13px] font-semibold transition-all duration-200 hover:-translate-y-[1px] disabled:opacity-50 disabled:hover:translate-y-0";
  
  if (variant === "primary") {
    return <button {...props} className={`${baseClasses} btn-primary`}>{children}</button>;
  }
  
  if (variant === "danger") {
    return <button {...props} className={`${baseClasses} bg-gradient-to-r from-red-600 to-rose-500 text-white shadow-[0_4px_14px_0_rgba(244,63,94,0.39)] hover:shadow-[0_6px_20px_rgba(244,63,94,0.23)] hover:from-red-500 hover:to-rose-400`}>{children}</button>;
  }

  // Ghost
  return <button {...props} className={`${baseClasses} border hover:bg-slate-500/10`} style={{ borderColor: "var(--border)", color: "var(--text-secondary)", background: "var(--bg-surface)" }}>{children}</button>;
}
