import type { Severity } from "../../api/notifications";
import clsx from "clsx";

const config: Record<Severity, { label: string; className: string; dot: string }> = {
  critical: { label: "CRITICAL", className: "bg-red-950 text-red-400 border-red-800", dot: "bg-red-500" },
  high:     { label: "HIGH",     className: "bg-orange-950 text-orange-400 border-orange-800", dot: "bg-orange-500" },
  medium:   { label: "MEDIUM",   className: "bg-yellow-950 text-yellow-400 border-yellow-800", dot: "bg-yellow-500" },
  low:      { label: "LOW",      className: "bg-blue-950 text-blue-400 border-blue-800", dot: "bg-blue-500" },
  info:     { label: "INFO",     className: "bg-slate-800 text-slate-400 border-slate-700", dot: "bg-slate-500" },
};

export default function SeverityBadge({ severity, size = "sm" }: { severity: Severity; size?: "xs" | "sm" }) {
  const { label, className, dot } = config[severity];
  return (
    <span className={clsx("inline-flex items-center gap-1 rounded border font-mono font-semibold", className, size === "xs" ? "px-1.5 py-0.5 text-[10px]" : "px-2 py-0.5 text-xs")}>
      <span className={clsx("rounded-full", dot, size === "xs" ? "w-1.5 h-1.5" : "w-2 h-2")} />
      {label}
    </span>
  );
}

export function CategoryBadge({ category }: { category: string }) {
  const map: Record<string, string> = {
    security: "bg-red-950 text-red-300 border-red-900",
    ai:       "bg-purple-950 text-purple-300 border-purple-900",
    it:       "bg-sky-950 text-sky-300 border-sky-900",
    general:  "bg-slate-800 text-slate-400 border-slate-700",
  };
  const label: Record<string, string> = { security: "🔐 Security", ai: "🤖 AI", it: "📰 IT", general: "📌 General" };
  return (
    <span className={clsx("inline-flex items-center rounded border px-1.5 py-0.5 text-[10px] font-semibold", map[category] ?? map.general)}>
      {label[category] ?? category}
    </span>
  );
}
