# HawkEye / VulnOps — Project Notes for Claude

Enterprise vulnerability management demo app (Next.js App Router). All data is
mock/CSV-backed with in-memory session mutations — **there is no backend, no
database, no real auth.** Keep that framing in mind: "add persistence",
"call the API", etc. almost always mean "extend the mock layer," not "wire up
a real service."

## Golden rule for this repo

Every past feature request has been the same shape: a large INCREMENTAL spec
that explicitly says preserve the existing visual language, reuse existing
components/patterns, and do not redesign or rebuild existing screens. Default
to that posture even when a new request doesn't spell it out. Concretely:
reuse `components/common/*`, the badge/table/card/modal styling already in
the codebase, and the layered architecture below, rather than introducing new
patterns.

## Layered architecture (follow this for any new feature)

```
types/*.ts          interfaces / unions — the data model
lib/csv/*.ts         parses one CSV into typed rows (one file per entity)
lib/csv/index.ts     loadAllData() aggregates every getX() into `AppData`
lib/business/*.ts    domain logic: risk scores, SLA status, filtering,
                     aggregation — pure functions, no React
lib/state/
  DataContext.tsx    loads AppData once, holds it in useState, exposes
                     getters (getAsset, getAudit, ...) and mutator callbacks
                     (scheduleAudit, updateRemediationStatus, ...) that patch
                     state in place — this is the entire "backend"
  AuthContext.tsx    session-only demo auth, resets on full page reload
components/<area>/*  "use client" UI, reads via useData()/useAuth()
app/<route>/page.tsx thin async wrapper: await searchParams, pass initial*
                     props to the client component, nothing else
```

When adding an entity end-to-end you touch, in order: `types/` →
`data/csv/*.csv` → `lib/csv/*.ts` loader → register in `lib/csv/index.ts` →
`lib/business/*.ts` if it needs derived logic → `DataContext.tsx` (state +
getters/mutators) → `components/` → `app/` route wrapper.

## CSV-as-database conventions

- CSVs live in `data/csv/*.csv` (plus a couple of legacy top-level files:
  `data/users.csv` is login accounts — **not** the same as `data/csv/users.csv`,
  which is the security-team directory used for ownership/assignment).
- CSVs are imported as raw text (`import raw from "@/data/csv/x.csv"`) via a
  webpack `asset/source` rule in `next.config.ts`, then parsed at runtime with
  PapaParse in `lib/csv/*.ts`. This is deliberate: an earlier
  `fs.readFileSync(path.join(process.cwd(), ...))` approach worked locally but
  silently broke in production because Vercel's build tracer can't see a
  dynamically-joined path — don't reintroduce `fs` reads for data files.
- **PapaParse trailing-newline trap:** if you script-generate a CSV, never
  append a trailing `\n` after `Papa.unparse(...)`. If the last row's last
  column is empty, that extra newline gets silently absorbed into the empty
  field on the next parse, corrupting data in a way that only surfaces later
  as a runtime crash (e.g. a badge component reading `undefined`). Write with
  `fs.writeFileSync(path, csv, "utf8")` and nothing appended.
- Demo "mutations" (scheduling an audit, changing a remediation's status,
  triaging a finding, etc.) only ever update React state in `DataContext`.
  Nothing is written back to the CSV files or persisted across a reload.

## Shared UI primitives (reuse, don't reinvent)

- `components/common/badges.tsx` — `SeverityBadge`, `StatusBadge`,
  `FindingTypeBadge`, `AuditFindingBadge`, `OwnerAvatar`, `CvssBadge`,
  `RiskScoreBar`, `EnvBadge`, `SlaBadge`. Status colors live in one
  `STATUS_CFG` map — add new statuses there rather than inlining new color
  logic in a component.
- `components/common/Modal.tsx` — the shell every modal in the app builds on.
- Tables follow the same recipe everywhere: a `FilterSelect` pill-style
  `<select>` (rounded, blue-highlighted when active, redefined locally per
  file — not yet extracted to `common/`), search box, `<table>` with a
  `hover:bg-slate-50` row and a chevron/click-through to detail.
- Styling is inline `style={{ background: "#F8FAFC", border: "1px solid
  #E2E8F0" }}`-style hex values + Tailwind utility classes, not a token/theme
  system. Match the existing palette; don't add new colors or a design system.

## Naming traps

- `components/audit/` + `app/audit/` (singular) is the pre-existing **Audit
  Trail** activity log — unrelated to `components/audits/` + `app/audits*`
  (plural), which is the **Audit Management** feature (audit scheduling,
  calendar, audit findings). Easy to grep the wrong one; check the singular
  vs. plural before assuming which "audit" feature you're in.
- "Finding Type" (`VAPT` / `SAST` / `DAST` / `SCA`, on `Vulnerability`) and
  "Audit Finding" (on `AuditFinding`, from an audit) are deliberately separate
  taxonomies with separate badges (`FindingTypeBadge` vs `AuditFindingBadge`).
  Do not merge them or auto-convert one into the other — that's an explicit
  product constraint, not an oversight.
- `Remediation.vulnerabilityId` and `Remediation.auditFindingId` are both
  optional; exactly one is set per record. Any code that reads a
  `Remediation` needs to branch on which one is present (see
  `RemediationBoard.tsx` / `RemediationDetail.tsx` for the pattern) rather
  than assuming `vulnerabilityId` always exists.

## Demo auth

Login accounts are in `data/users.csv` (`username`, `email`, `role`). Every
account shares one password: `hawkadmin` (see `DEFAULT_PASSWORD` in
`lib/state/AuthContext.tsx`). Auth state is session-only — a full page
reload/`page.goto()` logs you out. If you're driving the app with Playwright,
navigate via in-app link/button clicks after logging in, not `page.goto()`,
or you'll land back on `/login`.

## Verification workflow used for every past feature

1. `npx tsc --noEmit -p tsconfig.json` — must be clean.
2. `npm run build` — must be clean (this also runs `next lint` + type check).
3. Visual check with Playwright: `npm install --no-save playwright-core`,
   drive system Chrome via `executablePath` (no browser download needed),
   screenshot the new/changed routes, look for console/page errors, then
   `npm uninstall playwright-core` and delete any temp scripts/screenshots
   before finishing. Log in once via the form, then navigate by clicking
   sidebar links (see "Demo auth" above).
4. Only commit/push when the user explicitly says so ("commit to github").

## Where the bigger picture lives

This file covers *how* the codebase is put together. For *what's* been built
and *why* (feature history, product framing, explicit scope limitations like
"not a full GRC/CMDB"), the most reliable source is `git log` and the actual
code — this file intentionally doesn't duplicate that.
