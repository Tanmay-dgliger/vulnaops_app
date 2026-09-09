import Link from "next/link";
import { Users, Settings2, Plug, ChevronRight } from "lucide-react";

const SECTIONS = [
  { href: "/administration/users", icon: Users, title: "User Management", desc: "Manage the accounts that can sign in to HawkEye.", enabled: true },
  { href: "#", icon: Settings2, title: "SLA Policy Configuration", desc: "Tune remediation SLA thresholds by severity.", enabled: false },
  { href: "#", icon: Plug, title: "Integrations", desc: "Scanner, ticketing, and notification connectors.", enabled: false },
];

export default function AdministrationPage() {
  return (
    <div className="p-6 space-y-4 max-w-[1360px] mx-auto">
      <div>
        <h1 className="text-xl font-bold text-slate-900 font-heading">Administration</h1>
        <p className="text-sm text-slate-500 mt-0.5">System configuration and access management</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {SECTIONS.map((s) => {
          const Icon = s.icon;
          const card = (
            <div
              className="flex items-start gap-3.5 p-4 rounded-xl border h-full transition-all"
              style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", opacity: s.enabled ? 1 : 0.6 }}
            >
              <div className="flex items-center justify-center rounded-lg shrink-0" style={{ width: 38, height: 38, background: "#EFF6FF", color: "#2563EB" }}>
                <Icon size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <h3 className="text-sm font-semibold text-slate-900">{s.title}</h3>
                  {!s.enabled && <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Soon</span>}
                </div>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">{s.desc}</p>
              </div>
              {s.enabled && <ChevronRight size={16} className="text-slate-300 shrink-0 mt-1" />}
            </div>
          );
          return s.enabled ? (
            <Link key={s.title} href={s.href} className="hover:shadow-sm transition-shadow rounded-xl">
              {card}
            </Link>
          ) : (
            <div key={s.title} className="cursor-not-allowed">
              {card}
            </div>
          );
        })}
      </div>
    </div>
  );
}
