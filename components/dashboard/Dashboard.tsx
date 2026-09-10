"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { TrendingDown, TrendingUp, ChevronDown, Download, ArrowRight } from "lucide-react";
import { useData } from "@/lib/state/DataContext";
import {
  getDashboardMetrics, getVulnerabilityTrend, getSeverityDistribution, getTopAssets, getTopCVEs, getSlaCompliance,
} from "@/lib/business/metrics";
import { getLifecycleStages } from "@/lib/business/lifecycle";
import { SeverityBadge, SlaBadge, StatusBadge } from "@/components/common/badges";
import { calculateAge, calculateSlaStatus } from "@/lib/business/sla";

interface KPICard {
  label: string;
  value: string;
  delta: string;
  deltaDir: "up" | "down";
  deltaGood: boolean;
  accent?: string;
  href: string;
}

function SelectButton({
  label,
  options,
  value,
  onChange,
  small,
}: {
  label: string;
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
  small?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const current = options.find((o) => o.value === value)?.label ?? label;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 rounded-md transition-colors hover:bg-slate-50"
        style={{ padding: small ? "4px 10px" : "7px 12px", background: "#FFFFFF", border: "1px solid #E2E8F0", color: "#334155", fontSize: small ? 11 : 13, fontWeight: 500 }}
      >
        {current}
        <ChevronDown size={small ? 12 : 14} className="text-slate-400" />
      </button>
      {open && (
        <div
          className="absolute right-0 top-full mt-1.5 z-50 rounded-lg shadow-lg overflow-hidden"
          style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", minWidth: 180 }}
        >
          {options.map((o) => (
            <button
              key={o.value}
              onClick={() => { onChange(o.value); setOpen(false); }}
              className="flex items-center w-full text-left px-3 py-2 text-xs transition-colors hover:bg-slate-50"
              style={{ color: o.value === value ? "#2563EB" : "#334155", fontWeight: o.value === value ? 600 : 500 }}
            >
              {o.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function KPICardComp({ card }: { card: KPICard }) {
  const deltaColor = card.deltaGood ? "#16A34A" : "#DC2626";
  const DeltaIcon = card.deltaDir === "down" ? TrendingDown : TrendingUp;
  return (
    <Link
      href={card.href}
      className="rounded-xl p-4 border transition-shadow hover:shadow-sm block"
      style={{ background: "var(--card)", border: "1px solid var(--border)" }}
    >
      <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 mb-2">{card.label}</div>
      <div className="text-2xl font-bold font-heading" style={{ color: card.accent ?? "#0F172A" }}>{card.value}</div>
      <div className="flex items-center gap-1 mt-1.5">
        <DeltaIcon size={12} style={{ color: deltaColor }} />
        <span className="text-[11px] font-semibold" style={{ color: deltaColor }}>{card.deltaDir === "down" ? "↓" : "↑"} {card.delta}</span>
        <span className="text-[11px] text-slate-400">vs prior period</span>
      </div>
    </Link>
  );
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg shadow-lg border text-xs p-3" style={{ background: "#0F172A", border: "1px solid #1E293B", color: "#E2E8F0", minWidth: 160 }}>
      <div className="font-semibold mb-2 text-white">{label} 2026</div>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center justify-between gap-4 mb-1">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full inline-block" style={{ background: p.color }} />
            <span className="text-slate-400">{p.name}</span>
          </div>
          <span className="font-medium text-white">{p.value.toLocaleString()}</span>
        </div>
      ))}
    </div>
  );
};

const DonutTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0];
  return (
    <div className="rounded-lg shadow-lg border text-xs p-3" style={{ background: "#0F172A", border: "1px solid #1E293B", color: "#E2E8F0" }}>
      <div className="font-medium text-white">{d.name}</div>
      <div className="text-slate-400 mt-0.5">{d.value.toLocaleString()} findings</div>
    </div>
  );
};

const TIME_RANGE_OPTIONS = [
  { value: "7", label: "Last 7 Days" },
  { value: "30", label: "Last 30 Days" },
  { value: "90", label: "Last 90 Days" },
  { value: "all", label: "All Time" },
];

export default function Dashboard() {
  const { vulnerabilities, assets } = useData();
  const [trendView, setTrendView] = useState<"all" | "critical">("all");
  const [timeRange, setTimeRange] = useState("30");
  const [businessUnit, setBusinessUnit] = useState("all");

  const buOptions = useMemo(() => {
    const units = Array.from(new Set(assets.map((a) => a.businessUnit))).sort();
    return [{ value: "all", label: "All Business Units" }, ...units.map((u) => ({ value: u, label: u }))];
  }, [assets]);

  const assetBuMap = useMemo(() => new Map(assets.map((a) => [a.id, a.businessUnit])), [assets]);

  const filteredAssets = useMemo(
    () => (businessUnit === "all" ? assets : assets.filter((a) => a.businessUnit === businessUnit)),
    [assets, businessUnit]
  );

  const filteredVulnerabilities = useMemo(() => {
    const cutoff = timeRange === "all" ? null : Date.now() - Number(timeRange) * 24 * 60 * 60 * 1000;
    return vulnerabilities.filter((v) => {
      if (businessUnit !== "all" && assetBuMap.get(v.assetId) !== businessUnit) return false;
      if (cutoff !== null && new Date(v.firstSeen).getTime() < cutoff) return false;
      return true;
    });
  }, [vulnerabilities, businessUnit, assetBuMap, timeRange]);

  const metrics = useMemo(() => getDashboardMetrics(filteredVulnerabilities), [filteredVulnerabilities]);
  const trendData = useMemo(() => getVulnerabilityTrend(filteredVulnerabilities), [filteredVulnerabilities]);
  const severityData = useMemo(() => getSeverityDistribution(filteredVulnerabilities), [filteredVulnerabilities]);
  const lifecycle = useMemo(() => getLifecycleStages(filteredVulnerabilities), [filteredVulnerabilities]);
  const topAssets = useMemo(() => getTopAssets(filteredVulnerabilities, filteredAssets, 5), [filteredVulnerabilities, filteredAssets]);
  const topCVEs = useMemo(() => getTopCVEs(filteredVulnerabilities, 5), [filteredVulnerabilities]);
  const sla = useMemo(() => getSlaCompliance(filteredVulnerabilities), [filteredVulnerabilities]);

  const total = severityData.reduce((a, d) => a + d.value, 0) || 1;
  const compliancePct = sla.compliancePct / 100;

  const kpiCards: KPICard[] = [
    { label: "Total Findings", value: metrics.totalFindings.toLocaleString(), delta: "8.4%", deltaDir: "down", deltaGood: true, href: "/vulnerabilities" },
    { label: "Critical & High", value: metrics.criticalAndHigh.toLocaleString(), delta: "12.1%", deltaDir: "down", deltaGood: true, accent: "#DC2626", href: "/vulnerabilities?severity=Critical-High" },
    { label: "SLA Breaches", value: metrics.slaBreaches.toLocaleString(), delta: "4.2%", deltaDir: "up", deltaGood: false, accent: "#EA580C", href: "/vulnerabilities?sla=Breached" },
    { label: "Open Vulnerabilities", value: metrics.openVulnerabilities.toLocaleString(), delta: "6.8%", deltaDir: "down", deltaGood: true, href: "/vulnerabilities?status=open" },
    { label: "Remediated", value: metrics.remediated.toLocaleString(), delta: "14.7%", deltaDir: "up", deltaGood: true, accent: "#16A34A", href: "/vulnerabilities?status=Closed" },
    { label: "False Positives", value: metrics.falsePositives.toLocaleString(), delta: "9.2%", deltaDir: "down", deltaGood: true, href: "/vulnerabilities?status=False Positive" },
  ];

  const lifecycleColors = ["#64748B", "#7C3AED", "#2563EB", "#EA580C", "#D97706", "#16A34A"];
  const lifecycleBg = ["#F8FAFC", "#F5F3FF", "#EFF6FF", "#FFF7ED", "#FFFBEB", "#F0FDF4"];

  return (
    <div className="p-6 space-y-6 max-w-[1360px] mx-auto">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 font-heading">Vulnerability Overview</h1>
          <p className="text-sm text-slate-500 mt-0.5">Enterprise security posture and remediation performance</p>
        </div>
        <div className="flex items-center gap-2">
          <SelectButton label="Last 30 Days" options={TIME_RANGE_OPTIONS} value={timeRange} onChange={setTimeRange} />
          <SelectButton label="All Business Units" options={buOptions} value={businessUnit} onChange={setBusinessUnit} />
          <Link href="/reports" className="flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-colors" style={{ background: "#2563EB", color: "#FFFFFF", border: "1px solid #2563EB" }}>
            <Download size={14} />
            Export Report
          </Link>
        </div>
      </div>

      <section className="grid grid-cols-6 gap-4">
        {kpiCards.map((card) => <KPICardComp key={card.label} card={card} />)}
      </section>

      <section className="grid grid-cols-12 gap-4">
        <div className="col-span-8 rounded-xl border p-5" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Vulnerability Trend</h3>
              <p className="text-xs text-slate-500 mt-0.5">Last 6 months — cumulative open findings</p>
            </div>
            <div className="flex items-center gap-1 rounded-md p-0.5" style={{ background: "#F1F5F9" }}>
              {(["all", "critical"] as const).map((v) => (
                <button key={v} onClick={() => setTrendView(v)} className="rounded px-2.5 py-1 text-xs font-medium transition-colors"
                  style={{ background: trendView === v ? "#FFFFFF" : "transparent", color: trendView === v ? "#0F172A" : "#64748B", boxShadow: trendView === v ? "0 1px 2px rgba(0,0,0,0.08)" : "none" }}>
                  {v === "all" ? "All Severities" : "Critical Only"}
                </button>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={trendData} margin={{ top: 4, right: 4, bottom: 0, left: -8 }}>
              <defs>
                <linearGradient id="gLow" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#16A34A" stopOpacity={0.15} /><stop offset="95%" stopColor="#16A34A" stopOpacity={0.02} /></linearGradient>
                <linearGradient id="gMed" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#D97706" stopOpacity={0.2} /><stop offset="95%" stopColor="#D97706" stopOpacity={0.02} /></linearGradient>
                <linearGradient id="gHigh" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#EA580C" stopOpacity={0.2} /><stop offset="95%" stopColor="#EA580C" stopOpacity={0.02} /></linearGradient>
                <linearGradient id="gCrit" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#DC2626" stopOpacity={0.2} /><stop offset="95%" stopColor="#DC2626" stopOpacity={0.02} /></linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#94A3B8" }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#94A3B8" }} width={48} tickFormatter={(v) => (v >= 1000 ? `${v / 1000}k` : String(v))} />
              <Tooltip content={<CustomTooltip />} />
              {trendView === "all" ? (
                <>
                  <Area type="monotone" dataKey="low" name="Low" stackId="1" stroke="#16A34A" fill="url(#gLow)" strokeWidth={1.5} dot={false} />
                  <Area type="monotone" dataKey="medium" name="Medium" stackId="1" stroke="#D97706" fill="url(#gMed)" strokeWidth={1.5} dot={false} />
                  <Area type="monotone" dataKey="high" name="High" stackId="1" stroke="#EA580C" fill="url(#gHigh)" strokeWidth={1.5} dot={false} />
                  <Area type="monotone" dataKey="critical" name="Critical" stackId="1" stroke="#DC2626" fill="url(#gHigh)" strokeWidth={2} dot={false} />
                </>
              ) : (
                <Area type="monotone" dataKey="critical" name="Critical" stroke="#DC2626" fill="url(#gCrit)" strokeWidth={2} dot={{ r: 3, fill: "#DC2626" }} />
              )}
            </AreaChart>
          </ResponsiveContainer>
          {trendView === "all" && (
            <div className="flex items-center gap-5 mt-3 justify-center">
              {[{ label: "Critical", color: "#DC2626" }, { label: "High", color: "#EA580C" }, { label: "Medium", color: "#D97706" }, { label: "Low", color: "#16A34A" }].map((d) => (
                <div key={d.label} className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: d.color, opacity: 0.8 }} /><span className="text-xs text-slate-500">{d.label}</span></div>
              ))}
            </div>
          )}
        </div>

        <div className="col-span-4 rounded-xl border p-5" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-slate-900">Severity Distribution</h3>
            <p className="text-xs text-slate-500 mt-0.5">Current open findings by severity</p>
          </div>
          <div className="relative">
            <ResponsiveContainer width="100%" height={170}>
              <PieChart>
                <Pie data={severityData} cx="50%" cy="50%" innerRadius={52} outerRadius={78} paddingAngle={2} dataKey="value" strokeWidth={0}>
                  {severityData.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
                </Pie>
                <Tooltip content={<DonutTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ paddingBottom: 8 }}>
              <div className="text-center">
                <div className="text-xl font-bold text-slate-900">{total >= 1000 ? `${(total / 1000).toFixed(1)}k` : total}</div>
                <div className="text-[10px] text-slate-500 font-medium uppercase tracking-wide">Total</div>
              </div>
            </div>
          </div>
          <div className="space-y-2 mt-3">
            {severityData.map((d) => (
              <div key={d.name} className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: d.color }} />
                <span className="text-xs text-slate-600 flex-1">{d.name}</span>
                <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: "#F1F5F9" }}>
                  <div className="h-full rounded-full" style={{ width: `${(d.value / total) * 100}%`, background: d.color, opacity: 0.85 }} />
                </div>
                <span className="text-xs font-semibold text-slate-700 w-12 text-right">{d.value.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-xl border p-5" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Vulnerability Lifecycle</h3>
            <p className="text-xs text-slate-500 mt-0.5">Current distribution across workflow stages</p>
          </div>
        </div>
        <div className="flex items-center gap-0">
          {lifecycle.map((stage, i) => (
            <div key={stage.label} className="flex items-center flex-1 min-w-0">
              <div className="flex-1 rounded-lg p-3 text-center transition-all hover:shadow-sm" style={{ background: lifecycleBg[i], border: `1px solid ${lifecycleColors[i]}22` }}>
                <div className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: lifecycleColors[i] }}>{stage.label}</div>
                <div className="text-xl font-bold text-slate-900">{stage.count.toLocaleString()}</div>
                <div className="text-[10px] text-slate-500 mt-0.5">{stage.pct}% of scanned</div>
              </div>
              {i < lifecycle.length - 1 && <div className="shrink-0 mx-1"><ArrowRight size={14} className="text-slate-300" /></div>}
            </div>
          ))}
        </div>
      </section>

      <section className="grid grid-cols-12 gap-4">
        <div className="col-span-3 rounded-xl border p-5 flex flex-col" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-slate-900">SLA Compliance</h3>
            <p className="text-xs text-slate-500 mt-0.5">Live snapshot of open findings</p>
          </div>
          <div className="flex-1 flex flex-col items-center justify-center">
            <div className="relative flex items-center justify-center" style={{ width: 140, height: 140 }}>
              <svg width="140" height="140" viewBox="0 0 140 140">
                <circle cx="70" cy="70" r="56" fill="none" stroke="#F1F5F9" strokeWidth="14" />
                <circle cx="70" cy="70" r="56" fill="none" stroke="#16A34A" strokeWidth="14" strokeLinecap="round"
                  strokeDasharray={`${compliancePct * 2 * Math.PI * 56} ${2 * Math.PI * 56}`} transform="rotate(-90 70 70)" />
                <circle cx="70" cy="70" r="56" fill="none" stroke="#DC2626" strokeWidth="14" strokeLinecap="round"
                  strokeDasharray={`${(1 - compliancePct) * 2 * Math.PI * 56} ${2 * Math.PI * 56}`} transform={`rotate(${-90 + compliancePct * 360} 70 70)`} opacity={0.6} />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold text-slate-900">{sla.compliancePct}%</span>
                <span className="text-[11px] text-slate-500 font-medium">Within SLA</span>
              </div>
            </div>
            <div className="w-full mt-4 space-y-2">
              <div className="flex items-center justify-between text-xs"><div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full" style={{ background: "#16A34A" }} /><span className="text-slate-600">Within SLA</span></div><span className="font-semibold text-slate-900">{sla.withinSla.toLocaleString()}</span></div>
              <div className="flex items-center justify-between text-xs"><div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full" style={{ background: "#DC2626" }} /><span className="text-slate-600">Breached</span></div><span className="font-semibold text-slate-900">{sla.breached.toLocaleString()}</span></div>
              <div className="flex items-center justify-between text-xs"><div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full" style={{ background: "#D97706" }} /><span className="text-slate-600">Due within 7 days</span></div><span className="font-semibold text-slate-900">{sla.dueSoon.toLocaleString()}</span></div>
            </div>
          </div>
        </div>

        <div className="col-span-9 rounded-xl border" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
          <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: "var(--border)" }}>
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Top Vulnerable Assets</h3>
              <p className="text-xs text-slate-500 mt-0.5">Assets with highest critical and high severity counts</p>
            </div>
            <Link href="/assets" className="text-xs text-blue-600 font-medium flex items-center gap-1 hover:text-blue-700 transition-colors">View all assets <ArrowRight size={12} /></Link>
          </div>
          <table className="w-full text-sm">
            <thead><tr style={{ borderBottom: "1px solid var(--border)" }}>
              {["Asset", "Type", "Critical", "High", "Owner", "SLA Status"].map((h) => <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500">{h}</th>)}
            </tr></thead>
            <tbody>
              {topAssets.map((row, i) => (
                <tr key={row.asset.id} className="transition-colors cursor-pointer hover:bg-slate-50" style={{ borderBottom: i < topAssets.length - 1 ? "1px solid var(--border)" : "none" }}>
                  <td className="px-4 py-3"><Link href={`/assets/${row.asset.id}`} className="font-semibold text-slate-900 font-mono text-xs hover:text-blue-700">{row.asset.name}</Link></td>
                  <td className="px-4 py-3"><span className="text-xs text-slate-500">{row.asset.type}</span></td>
                  <td className="px-4 py-3"><span className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-bold" style={{ background: "#FEF2F2", color: "#DC2626" }}>{row.critical}</span></td>
                  <td className="px-4 py-3"><span className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-bold" style={{ background: "#FFF7ED", color: "#EA580C" }}>{row.high}</span></td>
                  <td className="px-4 py-3"><span className="text-xs text-slate-700">{row.asset.owner}</span></td>
                  <td className="px-4 py-3"><SlaBadge state={row.slaStatus as any} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-xl border" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: "var(--border)" }}>
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Top CVEs</h3>
            <p className="text-xs text-slate-500 mt-0.5">Highest-impact CVEs across the enterprise</p>
          </div>
          <Link href="/vulnerabilities" className="text-xs text-blue-600 font-medium flex items-center gap-1 hover:text-blue-700 transition-colors">View all CVEs <ArrowRight size={12} /></Link>
        </div>
        <table className="w-full text-sm">
          <thead><tr style={{ borderBottom: "1px solid var(--border)" }}>
            {["CVE ID", "Severity", "Description", "Affected Assets", "Age (days)", "Status"].map((h) => <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500">{h}</th>)}
          </tr></thead>
          <tbody>
            {topCVEs.map((row, i) => (
              <tr key={row.cve} className="transition-colors cursor-pointer hover:bg-slate-50" style={{ borderBottom: i < topCVEs.length - 1 ? "1px solid var(--border)" : "none" }}>
                <td className="px-4 py-3"><span className="font-mono text-xs font-semibold text-slate-900">{row.cve}</span></td>
                <td className="px-4 py-3"><SeverityBadge severity={row.severity} /></td>
                <td className="px-4 py-3"><span className="text-xs text-slate-600">{row.title}</span></td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 rounded-full" style={{ width: 40, background: "#F1F5F9" }}>
                      <div className="h-full rounded-full" style={{ width: `${Math.min((row.assetCount / 20) * 100, 100)}%`, background: row.severity === "Critical" ? "#DC2626" : "#EA580C", opacity: 0.8 }} />
                    </div>
                    <span className="text-xs font-semibold text-slate-900">{row.assetCount}</span>
                  </div>
                </td>
                <td className="px-4 py-3"><span className={`text-xs font-semibold ${row.maxAge > 30 ? "text-red-600" : row.maxAge > 14 ? "text-amber-600" : "text-slate-700"}`}>{row.maxAge}d</span></td>
                <td className="px-4 py-3"><StatusBadge status={row.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <div className="h-4" />
    </div>
  );
}
