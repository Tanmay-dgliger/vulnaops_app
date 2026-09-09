import type { VulnerabilitySeverity, VulnerabilityStatus, Environment } from "@/types/vulnerability";
import type { SlaState } from "@/lib/business/sla";
import { initials, ownerColor } from "@/lib/business/format";

export const SEVERITY_CFG: Record<VulnerabilitySeverity, { bg: string; text: string; border: string; dot: string }> = {
  Critical: { bg: "#FEF2F2", text: "#DC2626", border: "#FECACA", dot: "#DC2626" },
  High: { bg: "#FFF7ED", text: "#EA580C", border: "#FED7AA", dot: "#EA580C" },
  Medium: { bg: "#FFFBEB", text: "#D97706", border: "#FDE68A", dot: "#D97706" },
  Low: { bg: "#F0FDF4", text: "#16A34A", border: "#BBF7D0", dot: "#16A34A" },
};

export function SeverityBadge({ severity }: { severity: VulnerabilitySeverity }) {
  const c = SEVERITY_CFG[severity];
  return (
    <span
      className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap"
      style={{ background: c.bg, color: c.text, border: `1px solid ${c.border}` }}
    >
      <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: c.dot }} />
      {severity}
    </span>
  );
}

const STATUS_CFG: Record<string, { bg: string; text: string }> = {
  New: { bg: "#EFF6FF", text: "#2563EB" },
  Triaged: { bg: "#F5F3FF", text: "#7C3AED" },
  Assigned: { bg: "#FFF7ED", text: "#C2410C" },
  Remediating: { bg: "#EFF6FF", text: "#1D4ED8" },
  Validation: { bg: "#F5F3FF", text: "#7C3AED" },
  Closed: { bg: "#F0FDF4", text: "#15803D" },
  "SLA Breached": { bg: "#FEF2F2", text: "#DC2626" },
  "Accepted Risk": { bg: "#F8FAFC", text: "#64748B" },
  "False Positive": { bg: "#F8FAFC", text: "#94A3B8" },
  "Potential False Positive": { bg: "#FFFBEB", text: "#D97706" },
  Duplicate: { bg: "#F8FAFC", text: "#94A3B8" },
};

export function StatusBadge({ status }: { status: VulnerabilityStatus | string }) {
  const c = STATUS_CFG[status] ?? { bg: "#F8FAFC", text: "#64748B" };
  return (
    <span className="inline-flex items-center rounded px-2 py-0.5 text-[11px] font-medium whitespace-nowrap" style={{ background: c.bg, color: c.text }}>
      {status}
    </span>
  );
}

const SLA_CFG: Record<SlaState, { color: string; bg: string }> = {
  Breached: { color: "#DC2626", bg: "#FEF2F2" },
  "Due Soon": { color: "#D97706", bg: "#FFFBEB" },
  "Within SLA": { color: "#16A34A", bg: "#F0FDF4" },
};

export function SlaBadge({ state, label }: { state: SlaState; label?: string }) {
  const c = SLA_CFG[state];
  return (
    <span className="text-xs font-semibold whitespace-nowrap" style={{ color: c.color }}>
      {label ?? state}
    </span>
  );
}

export function SlaPill({ state }: { state: SlaState }) {
  const c = SLA_CFG[state];
  return (
    <span className="inline-flex items-center rounded px-2 py-0.5 text-[11px] font-medium" style={{ background: c.bg, color: c.color }}>
      {state}
    </span>
  );
}

const ENV_CFG: Record<Environment, { bg: string; text: string }> = {
  Production: { bg: "#FEF2F2", text: "#DC2626" },
  Staging: { bg: "#FFFBEB", text: "#D97706" },
  Development: { bg: "#F0FDF4", text: "#16A34A" },
  DR: { bg: "#F5F3FF", text: "#7C3AED" },
};

export function EnvBadge({ env }: { env: Environment }) {
  const c = ENV_CFG[env];
  return (
    <span className="inline-flex items-center rounded px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide whitespace-nowrap" style={{ background: c.bg, color: c.text }}>
      {env}
    </span>
  );
}

export function RiskScoreBar({ score, width = 64 }: { score: number; width?: number }) {
  const color = score >= 90 ? "#DC2626" : score >= 70 ? "#EA580C" : score >= 50 ? "#D97706" : "#16A34A";
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 rounded-full overflow-hidden" style={{ width, background: "#F1F5F9" }}>
        <div className="h-full rounded-full" style={{ width: `${score}%`, background: color }} />
      </div>
      <span className="text-xs font-bold tabular-nums" style={{ color }}>
        {score}
      </span>
    </div>
  );
}

export function CvssBadge({ cvss }: { cvss: number }) {
  const color = cvss >= 9 ? "#DC2626" : cvss >= 7 ? "#EA580C" : cvss >= 4 ? "#D97706" : "#16A34A";
  return (
    <span className="text-xs font-bold tabular-nums px-1.5 py-0.5 rounded" style={{ color, background: `${color}14` }}>
      {cvss.toFixed(1)}
    </span>
  );
}

export function OwnerAvatar({ name, size = 22 }: { name: string; size?: number }) {
  if (!name || name === "—" || name === "") {
    return <span className="text-xs text-slate-400 italic">Unassigned</span>;
  }
  return (
    <div className="flex items-center gap-2">
      <div
        className="flex items-center justify-center rounded-full text-[9px] font-bold text-white shrink-0"
        style={{ width: size, height: size, background: ownerColor(name) }}
      >
        {initials(name)}
      </div>
      <span className="text-xs text-slate-700 whitespace-nowrap">{name}</span>
    </div>
  );
}
