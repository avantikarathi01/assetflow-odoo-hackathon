"use client";
import { ReactNode, useEffect } from "react";
import { X } from "lucide-react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  width?: string;
}

export function Modal({ open, onClose, title, children, width = "max-w-lg" }: ModalProps) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in" style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }} onClick={onClose}>
      <div
        className={`w-full ${width} rounded-xl shadow-2xl glass-card overflow-hidden`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: "var(--border-subtle)", background: "rgba(255,255,255,0.02)" }}>
          <h2 className="text-[15px] font-semibold tracking-wide" style={{ color: "var(--text-primary)" }}>{title}</h2>
          <button onClick={onClose} className="rounded-full p-1.5 hover:bg-white/10 transition-colors" style={{ color: "var(--text-secondary)" }}>
            <X size={16} />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
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
      className="w-full px-3 py-2 rounded-lg border text-[13px] bg-transparent outline-none transition-all placeholder-slate-600 focus:border-blue-500"
      style={{ borderColor: "var(--border)", color: "var(--text-primary)" }}
    />
  );
}

export function Textarea({ ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      rows={3}
      className="w-full px-3 py-2 rounded-lg border text-[13px] bg-transparent outline-none transition-all placeholder-slate-600 focus:border-blue-500 resize-none"
      style={{ borderColor: "var(--border)", color: "var(--text-primary)" }}
    />
  );
}

export function SelectField({ children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement> & { children: ReactNode }) {
  return (
    <select
      {...props}
      className="w-full px-3 py-2 rounded-lg border text-[13px] bg-transparent outline-none transition-all focus:border-blue-500 appearance-none cursor-pointer"
      style={{ borderColor: "var(--border)", color: "var(--text-primary)", backgroundColor: "rgba(14,20,36,0.9)" }}
    >
      {children}
    </select>
  );
}

export function Btn({ children, variant = "primary", ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "ghost" | "danger" }) {
  const baseClasses = "px-4 py-2 rounded-lg text-[13px] font-semibold transition-all duration-200 hover:-translate-y-[1px] disabled:opacity-50 disabled:hover:translate-y-0";
  
  if (variant === "primary") {
    return <button {...props} className={`${baseClasses} bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-[0_4px_14px_0_rgba(59,130,246,0.39)] hover:shadow-[0_6px_20px_rgba(59,130,246,0.23)] hover:from-blue-500 hover:to-blue-400`}>{children}</button>;
  }
  
  if (variant === "danger") {
    return <button {...props} className={`${baseClasses} bg-gradient-to-r from-red-600 to-rose-500 text-white shadow-[0_4px_14px_0_rgba(244,63,94,0.39)] hover:shadow-[0_6px_20px_rgba(244,63,94,0.23)] hover:from-red-500 hover:to-rose-400`}>{children}</button>;
  }

  // Ghost
  return <button {...props} className={`${baseClasses} bg-white/5 border border-white/10 hover:bg-white/10 text-slate-300`}>{children}</button>;
}
