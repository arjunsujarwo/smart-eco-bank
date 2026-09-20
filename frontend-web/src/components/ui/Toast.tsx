"use client";
import Icon from "./Icon";
import type { ToastState } from "@/hooks/useToast";

const CONFIG: Record<ToastState["type"], { bg: string; text: string; icon: string }> = {
  success: { bg: "bg-primary", text: "text-on-primary", icon: "check_circle" },
  error: { bg: "bg-error", text: "text-on-error", icon: "error" },
  info: { bg: "bg-secondary", text: "text-on-secondary", icon: "info" },
};

export default function Toast({ msg, type }: ToastState) {
  const c = CONFIG[type];
  return (
    <div
      className={`fixed top-20 left-1/2 -translate-x-1/2 z-[200] flex items-center gap-3 ${c.bg} ${c.text} px-5 py-3 rounded-2xl shadow-2xl animate-in fade-in slide-in-from-top-2 duration-300 max-w-sm text-center`}
    >
      <Icon name={c.icon} fill className="shrink-0" />
      <span className="text-sm font-medium">{msg}</span>
    </div>
  );
}
