"use client";

import { useMemo } from "react";
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from "recharts";
import { Download, FileText, BarChart3, TrendingDown, TrendingUp } from "lucide-react";
import { useData } from "@/lib/state/DataContext";
import {
  getDashboardMetrics, getVulnerabilityTrend, getBusinessUnitRisk, getTopApplications, getTopAssets, getSlaCompliance,
} from "@/lib/business/metrics";

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg shadow-xl border text-xs p-3" style={{ background: "#0F172A", border: "1px solid #1E293B", color: "#E2E8F0", minWidth: 140 }}>
      <div className="font-semibold mb-1.5 text-white">{label}</div>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center justify-between gap-4 mb-0.5">
          <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full inline-block" style={{ background: p.color }} /><span className="text-slate-400">{p.name}</span></div>
          <span className="font-semibold text-white">{typeof p.value === "number" ? p.value.toLocaleString() : p.value}</span>
        </div>
      ))}
    </div>
  );
}

function SelectBtn({ label }: { label: string }) {
  return <button className="flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium" style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", color: "#334155" }}>{label}</button>;
}

function SectionCard({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border" style={{ background: "#FFFFFF", border: "1px solid #E2E8F0" }}>
      <div className="px-5 py-4 border-b" style={{ borderColor: "#F1F5F9" }}><h3 className="text-sm font-semibold text-slate-900">{title}</h3>{subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}</div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function downloadCsv(filename: string, rows: string[][]) {
  const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function MISReporting() {
  const { vulnerabilities, assets, applications } = useData();

  const metrics = useMemo(() => getDashboardMetrics(vulnerabilities), [vulnerabilities]);
  const trend = useMemo(() => getVulnerabilityTrend(vulnerabilities), [vulnerabilities]);
  const buRisk = useMemo(() => getBusinessUnitRisk(vulnerabilities, assets), [vulnerabilities, assets]);
  const topApps = useMemo(() => getTopApplications(vulnerabilities, applications, 10), [vulnerabilities, applications]);
  const topAssets = useMemo(() => getTopAssets(vulnerabilities, assets, 10), [vulnerabilities, assets]);
  const sla = useMemo(() => getSlaCompliance(vulnerabilities), [vulnerabilities]);

  const falsePositives = vulnerabilities.filter((v) => v.status === "False Positive" || v.status === "Potential False Positive").length;
  const acceptedRisks = vulnerabilities.filter((v) => v.status === "Accepted Risk").length;
  const criticalCount = vulnerabilities.filter((v) => v.severity === "Critical").length;
  const highCount = vulnerabilities.filter((v) => v.severity === "High").length;

  const KPIS = [
    { label: "Total Vulnerabilities", value: metrics.totalFindings.toLocaleString(), good: true, accent: "#0F172A" },
    { label: "Critical", value: criticalCount.toLocaleString(), good: true, accent: "#DC2626" },
    { label: "High", value: highCount.toLocaleString(), good: true, accent: "#EA580C" },
    { label: "SLA Compliance", value: `${sla.compliancePct}%`, good: sla.compliancePct >= 85, accent: "#16A34A" },
    { label: "SLA Breaches", value: sla.breached.toLocaleString(), good: false, accent: "#DC2626" },
    { label: "Remediated", value: metrics.remediated.toLocaleString(), good: true, accent: "#16A34A" },
    { label: "False Positives", value: falsePositives.toLocaleString(), good: true, accent: "#64748B" },
    { label: "Accepted Risks", value: acceptedRisks.toLocaleString(), good: false, accent: "#D97706" },
  ];

  const exportExcel = () => {
    downloadCsv(
      "vulnops-mis-report.csv",
      [["CVE", "Title", "Severity", "CVSS", "Status", "Asset", "Environment", "Risk Score"], ...vulnerabilities.map((v) => [v.cve, v.title, v.severity, String(v.cvss), v.status, v.assetId, v.environment, String(v.riskScore)])]
    );
  };
  const exportPdf = () => window.print();

  return (
    <div className="p-6 space-y-6 max-w-[1360px] mx-auto">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 font-heading">Management Information System</h1>
          <p className="text-sm text-slate-500 mt-0.5">Executive vulnerability and remediation reporting</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <SelectBtn label="Last 30 Days" />
          <SelectBtn label="All Business Units" />
          <div className="w-px h-6 bg-slate-200 mx-1" />
          <button className="flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium" style={{ background: "#F8FAFC", color: "#334155", border: "1px solid #E2E8F0" }}><BarChart3 size={14} /> Generate Report</button>
          <button onClick={exportExcel} className="flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium" style={{ background: "#F8FAFC", color: "#334155", border: "1px solid #E2E8F0" }}><Download size={14} /> Export Excel</button>
          <button onClick={exportPdf} className="flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-semibold text-white" style={{ background: "#2563EB", boxShadow: "0 2px 8px rgba(37,99,235,0.3)" }}><FileText size={14} /> Export PDF</button>
        </div>
      </div>

      <div className="flex items-center gap-3 rounded-xl px-4 py-3 flex-wrap" style={{ background: "#F8FAFC", border: "1px solid #E2E8F0" }}>
        <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
        <span className="text-xs font-semibold text-slate-700">CONFIDENTIAL — CISO EXECUTIVE REPORT</span>
        <span className="text-xs text-slate-400">·</span>
        <span className="text-xs text-slate-500">Generated by Tanmay Singh · 09 Sep 2026, 17:00 UTC</span>
      </div>

      <div className="grid grid-cols-8 gap-3">
        {KPIS.map((kpi) => (
          <div key={kpi.label} className="rounded-xl border p-3.5" style={{ background: "#FFFFFF", border: "1px solid #E2E8F0" }}>
            <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5 leading-tight">{kpi.label}</div>
            <div className="text-xl font-bold font-heading" style={{ color: kpi.accent }}>{kpi.value}</div>
            <div className="flex items-center gap-1 mt-1">{kpi.good ? <TrendingDown size={10} className="text-green-500" /> : <TrendingUp size={10} className="text-red-500" />}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-12 gap-5">
        <div className="col-span-7">
          <SectionCard title="Vulnerability Trend" subtitle="Total open findings over last 6 months">
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={trend} margin={{ top: 4, right: 4, bottom: 0, left: -8 }}>
                <defs><linearGradient id="gT" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#2563EB" stopOpacity={0.15} /><stop offset="95%" stopColor="#2563EB" stopOpacity={0.01} /></linearGradient></defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} width={40} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="total" name="Total" stroke="#2563EB" fill="url(#gT)" strokeWidth={2} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </SectionCard>
        </div>
        <div className="col-span-5">
          <SectionCard title="Severity Trend" subtitle="Critical and High over last 6 months">
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={trend} margin={{ top: 4, right: 4, bottom: 0, left: -8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} width={36} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="critical" name="Critical" stroke="#DC2626" strokeWidth={2} dot={{ r: 3, fill: "#DC2626" }} />
                <Line type="monotone" dataKey="high" name="High" stroke="#EA580C" strokeWidth={2} dot={{ r: 3, fill: "#EA580C" }} />
              </LineChart>
            </ResponsiveContainer>
          </SectionCard>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-5">
        <div className="col-span-4">
          <SectionCard title="SLA Compliance" subtitle="Live snapshot">
            <div className="flex flex-col items-center justify-center py-4">
              <div className="text-4xl font-bold font-heading" style={{ color: "#16A34A" }}>{sla.compliancePct}%</div>
              <div className="text-xs text-slate-500 mt-1">within SLA</div>
            </div>
          </SectionCard>
        </div>
        <div className="col-span-8">
          <SectionCard title="Business Unit Risk" subtitle="Composite risk score by business unit">
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={buRisk} layout="vertical" margin={{ top: 0, right: 48, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10, fill: "#94A3B8" }} axisLine={false} tickLine={false} domain={[0, 100]} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: "#64748B" }} axisLine={false} tickLine={false} width={90} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="score" name="Risk Score" radius={[0, 3, 3, 0]} maxBarSize={14}>
                  {buRisk.map((entry, i) => <Cell key={i} fill={entry.score >= 75 ? "#DC2626" : entry.score >= 55 ? "#EA580C" : entry.score >= 40 ? "#D97706" : "#16A34A"} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </SectionCard>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-5">
        <div className="col-span-6">
          <div className="rounded-xl border overflow-hidden" style={{ background: "#FFFFFF", border: "1px solid #E2E8F0" }}>
            <div className="px-5 py-4 border-b" style={{ borderColor: "#F1F5F9" }}><h3 className="text-sm font-semibold text-slate-900">Top Vulnerable Applications</h3></div>
            <table className="w-full text-xs">
              <thead><tr style={{ borderBottom: "1px solid #F1F5F9", background: "#FAFBFC" }}>{["#", "Application", "Crit", "High", "Total", "Risk"].map((h) => <th key={h} className="px-4 py-2.5 text-left font-semibold uppercase tracking-wide text-slate-400">{h}</th>)}</tr></thead>
              <tbody>
                {topApps.map((row, i) => {
                  const riskColor = row.riskScore >= 90 ? "#DC2626" : row.riskScore >= 70 ? "#EA580C" : row.riskScore >= 50 ? "#D97706" : "#16A34A";
                  return (
                    <tr key={row.application.id} style={{ borderBottom: "1px solid #F8FAFC" }} className="hover:bg-slate-50">
                      <td className="px-4 py-2.5 font-mono font-bold text-slate-300">{String(i + 1).padStart(2, "0")}</td>
                      <td className="px-4 py-2.5 font-medium text-slate-800">{row.application.name}</td>
                      <td className="px-4 py-2.5"><span className="font-bold text-red-600">{row.critical}</span></td>
                      <td className="px-4 py-2.5"><span className="font-bold text-orange-600">{row.high}</span></td>
                      <td className="px-4 py-2.5 font-semibold text-slate-700">{row.total}</td>
                      <td className="px-4 py-2.5"><span className="font-bold tabular-nums" style={{ color: riskColor }}>{row.riskScore}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
        <div className="col-span-6">
          <div className="rounded-xl border overflow-hidden" style={{ background: "#FFFFFF", border: "1px solid #E2E8F0" }}>
            <div className="px-5 py-4 border-b" style={{ borderColor: "#F1F5F9" }}><h3 className="text-sm font-semibold text-slate-900">Top Vulnerable Assets</h3></div>
            <table className="w-full text-xs">
              <thead><tr style={{ borderBottom: "1px solid #F1F5F9", background: "#FAFBFC" }}>{["#", "Asset", "Business Unit", "Crit", "High", "Risk"].map((h) => <th key={h} className="px-4 py-2.5 text-left font-semibold uppercase tracking-wide text-slate-400">{h}</th>)}</tr></thead>
              <tbody>
                {topAssets.map((row, i) => {
                  const riskColor = row.riskScore >= 90 ? "#DC2626" : row.riskScore >= 70 ? "#EA580C" : row.riskScore >= 50 ? "#D97706" : "#16A34A";
                  return (
                    <tr key={row.asset.id} style={{ borderBottom: "1px solid #F8FAFC" }} className="hover:bg-slate-50">
                      <td className="px-4 py-2.5 font-mono font-bold text-slate-300">{String(i + 1).padStart(2, "0")}</td>
                      <td className="px-4 py-2.5 font-mono font-semibold text-slate-800">{row.asset.name}</td>
                      <td className="px-4 py-2.5 text-slate-500">{row.asset.businessUnit}</td>
                      <td className="px-4 py-2.5"><span className="font-bold text-red-600">{row.critical}</span></td>
                      <td className="px-4 py-2.5"><span className="font-bold text-orange-600">{row.high}</span></td>
                      <td className="px-4 py-2.5"><span className="font-bold tabular-nums" style={{ color: riskColor }}>{row.riskScore}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between text-[10px] text-slate-400 border-t pt-4" style={{ borderColor: "#E2E8F0" }}>
        <span>VulnOps Enterprise Vulnerability Management · Confidential</span>
      </div>
      <div className="h-4" />
    </div>
  );
}
