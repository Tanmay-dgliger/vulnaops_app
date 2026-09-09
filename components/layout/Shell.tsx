"use client";

import { ReactNode, Suspense, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  LayoutDashboard, Shield, FileX, ClipboardList, Server, AppWindow, Upload, BarChart3,
  ScrollText, Settings, Search, Bell, HelpCircle, ChevronRight, LogOut,
} from "lucide-react";
import { useData } from "@/lib/state/DataContext";
import { useAuth } from "@/lib/state/AuthContext";
import { calculateSlaStatus } from "@/lib/business/sla";
import { isOpen } from "@/lib/business/metrics";
import HawkEyeLogo from "@/components/common/HawkEyeLogo";

interface NavItem {
  href: string;
  label: string;
  icon: ReactNode;
  badge?: "sla";
}
interface NavGroup {
  label?: string;
  items: NavItem[];
}

const NAV: NavGroup[] = [
  { items: [{ href: "/dashboard", label: "Dashboard", icon: <LayoutDashboard size={16} /> }] },
  {
    label: "Vulnerabilities",
    items: [
      { href: "/vulnerabilities", label: "All Vulnerabilities", icon: <Shield size={16} /> },
      { href: "/exceptions", label: "Exceptions", icon: <FileX size={16} /> },
    ],
  },
  { label: "Remediation", items: [{ href: "/remediation", label: "Remediation Queue", icon: <ClipboardList size={16} /> }] },
  {
    label: "Inventory",
    items: [
      { href: "/assets", label: "Assets", icon: <Server size={16} /> },
      { href: "/applications", label: "Applications", icon: <AppWindow size={16} /> },
    ],
  },
  {
    label: "Data",
    items: [
      { href: "/scanner-imports", label: "Scanner Imports", icon: <Upload size={16} /> },
      { href: "/reports", label: "Reports / MIS", icon: <BarChart3 size={16} /> },
      { href: "/audit", label: "Audit Trail", icon: <ScrollText size={16} /> },
    ],
  },
  { label: "System", items: [{ href: "/administration", label: "Administration", icon: <Settings size={16} /> }] },
];

const FLAT_ITEMS = NAV.flatMap((g) => g.items);

/** The single "best" nav item for a given URL: an exact match (covers items with a
 *  filter query, e.g. "/vulnerabilities?status=New") takes priority; otherwise the
 *  nearest bare-path item covering this route (covers detail pages and filtered URLs
 *  that don't have their own dedicated nav entry, e.g. the Dashboard's KPI card links). */
function findActiveItem(pathname: string, currentUrl: string): NavItem | undefined {
  const exact = FLAT_ITEMS.find((i) => i.href === currentUrl);
  if (exact) return exact;
  return FLAT_ITEMS.find((i) => !i.href.includes("?") && (pathname === i.href || pathname.startsWith(`${i.href}/`)));
}

/** The only bit of the shell that needs the current URL (query included) — kept in its own
 *  narrow Suspense boundary so useSearchParams() never forces the whole page (including
 *  {children}) to bail out to client-side-only rendering. */
function NavLinks({ slaBreachCount }: { slaBreachCount: number }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentUrl = searchParams.toString() ? `${pathname}?${searchParams.toString()}` : pathname;
  const activeItem = findActiveItem(pathname, currentUrl);

  return (
    <>
      {NAV.map((group, gi) => (
        <div key={gi} className={gi > 0 ? "mt-1" : ""}>
          {group.label && <div className="px-5 py-2 text-[10px] font-semibold uppercase tracking-widest text-slate-600">{group.label}</div>}
          {group.items.map((item) => {
            const active = item === activeItem;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="w-full flex items-center gap-2.5 px-4 py-2 mx-1 text-left transition-all duration-100 rounded-md"
                style={{ width: "calc(100% - 8px)", background: active ? "#1E3A5F" : "transparent", color: active ? "#60A5FA" : "#94A3B8" }}
              >
                <span style={{ color: active ? "#60A5FA" : "#64748B" }}>{item.icon}</span>
                <span className="text-[13px] font-medium">{item.label}</span>
                {item.badge === "sla" && slaBreachCount > 0 && (
                  <span className="ml-auto text-[10px] font-semibold rounded-full px-1.5 py-0.5" style={{ background: "#7F1D1D", color: "#FCA5A5" }}>
                    {slaBreachCount}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      ))}
    </>
  );
}

function NavLinksFallback() {
  return (
    <>
      {NAV.map((group, gi) => (
        <div key={gi} className={gi > 0 ? "mt-1" : ""}>
          {group.label && <div className="px-5 py-2 text-[10px] font-semibold uppercase tracking-widest text-slate-600">{group.label}</div>}
          {group.items.map((item) => (
            <div key={item.href} className="w-full flex items-center gap-2.5 px-4 py-2 mx-1 text-left" style={{ width: "calc(100% - 8px)", color: "#94A3B8" }}>
              <span style={{ color: "#64748B" }}>{item.icon}</span>
              <span className="text-[13px] font-medium">{item.label}</span>
            </div>
          ))}
        </div>
      ))}
    </>
  );
}

/** Matches the currently active nav item including its filter query (e.g. shows
 *  "New / Untriaged" rather than "All Vulnerabilities" on /vulnerabilities?status=New) —
 *  needs useSearchParams(), so it's wrapped in Suspense at the call site. */
function Breadcrumb() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentUrl = searchParams.toString() ? `${pathname}?${searchParams.toString()}` : pathname;
  const activeItem = findActiveItem(pathname, currentUrl);
  const activeLabel = activeItem?.label ?? "Dashboard";
  const activeGroup = NAV.find((g) => g.items.includes(activeItem as NavItem))?.label;

  return (
    <div className="flex items-center gap-1.5 text-sm min-w-0">
      <span className="text-slate-400 font-medium">HawkEye</span>
      {activeGroup && (
        <>
          <ChevronRight size={14} className="text-slate-300 shrink-0" />
          <span className="text-slate-400 font-medium">{activeGroup}</span>
        </>
      )}
      <ChevronRight size={14} className="text-slate-300 shrink-0" />
      <span className="text-slate-800 font-semibold truncate">{activeLabel}</span>
    </div>
  );
}

function BreadcrumbFallback() {
  return (
    <div className="flex items-center gap-1.5 text-sm min-w-0">
      <span className="text-slate-400 font-medium">HawkEye</span>
    </div>
  );
}

export default function Shell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [notifications] = useState(7);
  const [searchFocused, setSearchFocused] = useState(false);
  const { vulnerabilities } = useData();
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
    router.replace("/login");
  };

  const slaBreachCount = vulnerabilities.filter((v) => isOpen(v) && calculateSlaStatus(v.severity, v.firstSeen, v.status).state === "Breached").length;

  return (
    <div className="flex h-full overflow-hidden" style={{ background: "var(--background)" }}>
      <aside className="flex flex-col shrink-0 overflow-hidden" style={{ width: 240, background: "#0F172A", borderRight: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="flex items-center gap-2.5 px-5 py-5 border-b border-white/[0.06]">
          <div className="flex items-center justify-center rounded-md shrink-0" style={{ width: 28, height: 28, background: "#FFFFFF" }}>
            <HawkEyeLogo size={22} />
          </div>
          <div>
            <div className="text-white font-bold text-sm tracking-tight leading-none font-heading">HAWKEYE</div>
            <div className="text-slate-500 text-[10px] leading-none mt-1 font-medium tracking-wide uppercase">Vulnerability Management</div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-3 scrollbar-hide">
          <Suspense fallback={<NavLinksFallback />}>
            <NavLinks slaBreachCount={slaBreachCount} />
          </Suspense>
        </nav>

        <div className="px-4 py-4 border-t border-white/[0.06]">
          <div className="text-[10px] font-semibold uppercase tracking-widest text-slate-600 mb-2">Security Operations</div>
          <button onClick={handleLogout} className="w-full flex items-center gap-2.5 group" aria-label="Sign out" title="Sign out">
            <div className="flex items-center justify-center rounded-full shrink-0 text-xs font-semibold text-white" style={{ width: 30, height: 30, background: "#1E40AF" }}>
              TS
            </div>
            <div className="min-w-0 text-left flex-1">
              <div className="text-[13px] font-medium text-slate-200 leading-none truncate">Tanmay Singh</div>
              <div className="text-[11px] text-slate-500 mt-0.5 truncate">Security Administrator</div>
            </div>
            <LogOut size={14} className="text-slate-600 shrink-0 group-hover:text-slate-300 transition-colors" />
          </button>
        </div>
      </aside>

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <header className="flex items-center px-6 shrink-0 gap-4" style={{ height: 64, background: "#FFFFFF", borderBottom: "1px solid var(--border)" }}>
          <Suspense fallback={<BreadcrumbFallback />}>
            <Breadcrumb />
          </Suspense>

          <div className="flex-1" />

          <div
            className="flex items-center gap-2 rounded-md px-3 transition-all"
            style={{ height: 36, width: searchFocused ? 260 : 200, background: "#F8FAFC", border: `1px solid ${searchFocused ? "#93C5FD" : "#E2E8F0"}`, transition: "all 0.2s" }}
          >
            <Search size={14} className="text-slate-400 shrink-0" />
            <input
              className="bg-transparent text-sm outline-none text-slate-700 placeholder-slate-400 flex-1 min-w-0"
              placeholder="Search vulnerabilities..."
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
            />
            <kbd className="text-[10px] text-slate-400 bg-white border border-slate-200 rounded px-1 font-mono shrink-0">⌘K</kbd>
          </div>

          <button className="relative flex items-center justify-center rounded-md transition-colors hover:bg-slate-50" style={{ width: 36, height: 36 }} aria-label="Notifications">
            <Bell size={18} className="text-slate-600" />
            {notifications > 0 && <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full" style={{ background: "#EF4444" }} />}
          </button>

          <button className="flex items-center justify-center rounded-md transition-colors hover:bg-slate-50" style={{ width: 36, height: 36 }} aria-label="Help">
            <HelpCircle size={18} className="text-slate-600" />
          </button>

          <div className="flex items-center justify-center rounded-full text-xs font-semibold text-white cursor-pointer" style={{ width: 32, height: 32, background: "#1E40AF" }}>
            TS
          </div>

          <div className="flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold" style={{ background: "#ECFDF5", color: "#059669", border: "1px solid #A7F3D0" }}>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
            Production
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
