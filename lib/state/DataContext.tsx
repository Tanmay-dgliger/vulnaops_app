"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import type { AppData } from "@/lib/csv";
import type { Vulnerability, BusinessCriticality, DataSensitivity, VulnerabilityStatus } from "@/types/vulnerability";
import type { Remediation, RemediationStatus } from "@/types/remediation";
import type { Exception, ExceptionStatus } from "@/types/exception";
import type { Activity, ActionType, EntityType } from "@/types/activity";
import type { ScannerImport } from "@/types/scanner-import";
import type { UserAccount } from "@/types/user-account";
import type { Asset } from "@/types/asset";
import type { AssetDiscoveryRecord } from "@/types/asset-discovery";
import { calculateRiskScore } from "@/lib/business/risk-score";
import { getFindingTypeForScanner } from "@/lib/business/scanner";
import { useToast } from "@/components/common/Toast";

interface DataState extends AppData {}

interface AddActivityInput {
  user: string;
  userRole: string;
  action: ActionType;
  entity: string;
  entityType: EntityType;
  from?: string;
  to?: string;
  detail?: string;
  severity?: Activity["severity"];
}

export type TriageDisposition = "remediate" | "accept" | "false-positive" | "compensating";

interface CompleteTriageInput {
  vulnerabilityId: string;
  fpAssessment: "none" | "potential" | "confirmed";
  criticality: BusinessCriticality;
  internetExposed: boolean;
  exploitAvailable: boolean;
  dataSensitivity: DataSensitivity;
  disposition: TriageDisposition;
  owner: string;
}

interface DataContextValue extends DataState {
  getVulnerability: (id: string) => Vulnerability | undefined;
  getAsset: (id: string) => DataState["assets"][number] | undefined;
  getApplication: (id: string) => DataState["applications"][number] | undefined;
  getRemediation: (id: string) => Remediation | undefined;
  getRemediationForVuln: (vulnerabilityId: string) => Remediation | undefined;
  getException: (id: string) => Exception | undefined;
  addActivity: (input: AddActivityInput) => Activity;
  completeTriage: (input: CompleteTriageInput) => void;
  mergeDuplicate: (vulnerabilityId: string, parentId: string) => void;
  keepSeparate: (vulnerabilityId: string) => void;
  assignOwner: (vulnerabilityId: string, owner: string) => void;
  approveException: (id: string) => void;
  rejectException: (id: string, reason: string) => void;
  requestMoreInfo: (id: string) => void;
  updateRemediationStatus: (id: string, status: RemediationStatus) => void;
  toggleChecklistItem: (id: string, itemId: string) => void;
  requestRevalidation: (id: string) => void;
  simulateValidation: (id: string) => void;
  addComment: (remediationId: string, text: string, user: string) => void;
  importScan: (scanner: string, file: string, recordCount?: number) => ScannerImport;
  addUserAccount: (input: UserAccount) => boolean;
  updateUserAccount: (originalUsername: string, input: UserAccount) => boolean;
  deleteUserAccount: (username: string) => void;
  getApi: (id: string) => DataState["apis"][number] | undefined;
  getCloudAsset: (id: string) => DataState["cloudAssets"][number] | undefined;
  matchDiscovery: (discoveryId: string, assetId: string) => void;
  createAssetFromDiscovery: (discoveryId: string, input: NewAssetInput) => Asset;
  ignoreDiscovery: (discoveryId: string) => void;
}

export interface NewAssetInput {
  name: string;
  type: Asset["type"];
  environment: Asset["environment"];
  owner: string;
  criticality: Asset["criticality"];
  businessUnit?: string;
  applicationId?: string;
}

const DataContext = createContext<DataContextValue | null>(null);

const CURRENT_USER = { name: "Tanmay Singh", role: "Security Administrator" };

function nextId(prefix: string) {
  return `${prefix}-${Date.now().toString(36).toUpperCase()}${Math.floor(Math.random() * 1000)}`;
}

function nowTimestamp() {
  return "2026-09-09T" + new Date().toTimeString().slice(0, 8);
}

export function DataProvider({ initial, children }: { initial: AppData; children: React.ReactNode }) {
  const [vulnerabilities, setVulnerabilities] = useState(initial.vulnerabilities);
  const [assets, setAssets] = useState(initial.assets);
  const [applications] = useState(initial.applications);
  const [remediations, setRemediations] = useState(initial.remediations);
  const [exceptions, setExceptions] = useState(initial.exceptions);
  const [scannerImports, setScannerImports] = useState(initial.scannerImports);
  const [activities, setActivities] = useState(initial.activities);
  const [users] = useState(initial.users);
  const [userAccounts, setUserAccounts] = useState(initial.userAccounts);
  const [apis] = useState(initial.apis);
  const [cloudAssets] = useState(initial.cloudAssets);
  const [assetRelationships] = useState(initial.assetRelationships);
  const [assetDiscovery, setAssetDiscovery] = useState(initial.assetDiscovery);
  const { notify } = useToast();

  const vulnById = useMemo(() => new Map(vulnerabilities.map((v) => [v.id, v])), [vulnerabilities]);
  const assetById = useMemo(() => new Map(assets.map((a) => [a.id, a])), [assets]);
  const applicationById = useMemo(() => new Map(applications.map((a) => [a.id, a])), [applications]);
  const remediationById = useMemo(() => new Map(remediations.map((r) => [r.id, r])), [remediations]);
  const exceptionById = useMemo(() => new Map(exceptions.map((e) => [e.id, e])), [exceptions]);
  const apiById = useMemo(() => new Map(apis.map((a) => [a.id, a])), [apis]);
  const cloudAssetById = useMemo(() => new Map(cloudAssets.map((c) => [c.id, c])), [cloudAssets]);
  const discoveryById = useMemo(() => new Map(assetDiscovery.map((d) => [d.id, d])), [assetDiscovery]);

  const addActivity = useCallback((input: AddActivityInput): Activity => {
    const activity: Activity = {
      id: nextId("ACT"),
      timestamp: nowTimestamp(),
      ip: "10.0.1.88",
      ...input,
    };
    setActivities((prev) => [activity, ...prev]);
    return activity;
  }, []);

  const patchVulnerability = useCallback((id: string, patch: Partial<Vulnerability>) => {
    setVulnerabilities((prev) => prev.map((v) => (v.id === id ? { ...v, ...patch } : v)));
  }, []);

  const patchRemediation = useCallback((id: string, patch: Partial<Remediation>) => {
    setRemediations((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }, []);

  const patchException = useCallback((id: string, patch: Partial<Exception>) => {
    setExceptions((prev) => prev.map((e) => (e.id === id ? { ...e, ...patch } : e)));
  }, []);

  const completeTriage = useCallback(
    (input: CompleteTriageInput) => {
      const vuln = vulnById.get(input.vulnerabilityId);
      if (!vuln) return;

      const riskScore = calculateRiskScore(vuln.cvss, input.criticality, input.internetExposed, input.exploitAvailable, input.dataSensitivity);

      let status: VulnerabilityStatus = "Assigned";
      if (input.disposition === "remediate") status = "Remediating";
      else if (input.disposition === "accept") status = "Accepted Risk";
      else if (input.disposition === "false-positive") status = "False Positive";
      else if (input.disposition === "compensating") status = "Accepted Risk";

      patchVulnerability(vuln.id, {
        businessCriticality: input.criticality,
        internetExposed: input.internetExposed,
        exploitAvailable: input.exploitAvailable,
        dataSensitivity: input.dataSensitivity,
        riskScore,
        status,
        owner: input.owner || vuln.owner,
      });

      addActivity({
        user: CURRENT_USER.name,
        userRole: CURRENT_USER.role,
        action: "triage_completed",
        entity: vuln.cve,
        entityType: "CVE",
        detail: `Risk scored ${riskScore}/100 — Disposition: ${input.disposition}`,
        severity: vuln.severity,
      });

      if (input.disposition === "remediate" && input.owner) {
        setRemediations((prev) => {
          const exists = prev.find((r) => r.vulnerabilityId === vuln.id);
          if (exists) return prev;
          const rem: Remediation = {
            id: nextId("REM"),
            vulnerabilityId: vuln.id,
            action: `Remediate ${vuln.title.toLowerCase()} on ${vuln.assetId}`,
            owner: input.owner,
            targetDate: vuln.dueDate ?? "",
            opened: "2026-09-09",
            status: "Assigned",
            progress: 5,
            validationResult: "Not Requested",
            checklist: [
              { id: "1", label: "Patch identified and validated", done: false },
              { id: "2", label: "Change request raised", done: false },
              { id: "3", label: "Patch deployed to production", done: false },
              { id: "4", label: "Validation scan requested", done: false },
              { id: "5", label: "Closure and sign-off", done: false },
            ],
            comments: [],
            evidence: [],
          };
          return [rem, ...prev];
        });
      }

      notify("Triage completed successfully");
    },
    [vulnById, patchVulnerability, addActivity, notify]
  );

  const mergeDuplicate = useCallback(
    (vulnerabilityId: string, parentId: string) => {
      const vuln = vulnById.get(vulnerabilityId);
      if (!vuln) return;
      patchVulnerability(vulnerabilityId, { isDuplicate: true, parentFindingId: parentId, status: "Duplicate" });
      addActivity({
        user: CURRENT_USER.name,
        userRole: CURRENT_USER.role,
        action: "merged",
        entity: vuln.cve,
        entityType: "CVE",
        detail: `Duplicate merged into ${parentId}`,
        severity: vuln.severity,
      });
      notify("Duplicate finding merged");
    },
    [vulnById, patchVulnerability, addActivity, notify]
  );

  const keepSeparate = useCallback(
    (vulnerabilityId: string) => {
      const vuln = vulnById.get(vulnerabilityId);
      if (!vuln) return;
      addActivity({
        user: CURRENT_USER.name,
        userRole: CURRENT_USER.role,
        action: "comment",
        entity: vuln.cve,
        entityType: "CVE",
        detail: "Reviewed potential duplicate — kept as separate finding",
        severity: vuln.severity,
      });
      notify("Findings kept separate");
    },
    [vulnById, addActivity, notify]
  );

  const assignOwner = useCallback(
    (vulnerabilityId: string, owner: string) => {
      const vuln = vulnById.get(vulnerabilityId);
      if (!vuln) return;
      const from = vuln.owner || "Unassigned";
      patchVulnerability(vulnerabilityId, { owner, status: vuln.status === "New" ? "Triaged" : vuln.status });
      addActivity({
        user: CURRENT_USER.name,
        userRole: CURRENT_USER.role,
        action: "assigned",
        entity: vuln.cve,
        entityType: "CVE",
        from,
        to: owner,
        severity: vuln.severity,
      });
      notify(`Vulnerability assigned to ${owner}`);
    },
    [vulnById, patchVulnerability, addActivity, notify]
  );

  const approveException = useCallback(
    (id: string) => {
      const exc = exceptionById.get(id);
      if (!exc) return;
      patchException(id, { status: "Approved", approvedBy: "Anita Rao" });
      const vuln = vulnById.get(exc.vulnerabilityId);
      if (vuln) {
        const newStatus: VulnerabilityStatus = exc.type === "False Positive" ? "False Positive" : "Accepted Risk";
        patchVulnerability(vuln.id, { status: newStatus });
      }
      addActivity({
        user: "Anita Rao",
        userRole: "Security Manager",
        action: "exception_approved",
        entity: exc.id,
        entityType: "Exception",
        detail: `${exc.type} exception approved for ${vuln?.cve ?? exc.vulnerabilityId} — ${exc.validFrom} to ${exc.validUntil}`,
      });
      notify("Exception approved");
    },
    [exceptionById, vulnById, patchException, patchVulnerability, addActivity, notify]
  );

  const rejectException = useCallback(
    (id: string, reason: string) => {
      const exc = exceptionById.get(id);
      if (!exc) return;
      patchException(id, { status: "Rejected" });
      addActivity({
        user: CURRENT_USER.name,
        userRole: CURRENT_USER.role,
        action: "exception_rejected",
        entity: exc.id,
        entityType: "Exception",
        detail: reason || "Rejected — insufficient justification documented",
      });
      notify("Exception rejected");
    },
    [exceptionById, patchException, addActivity, notify]
  );

  const requestMoreInfo = useCallback(
    (id: string) => {
      const exc = exceptionById.get(id);
      if (!exc) return;
      patchException(id, { status: "More Info Requested" });
      addActivity({
        user: CURRENT_USER.name,
        userRole: CURRENT_USER.role,
        action: "comment",
        entity: exc.id,
        entityType: "Exception",
        detail: "More information requested from requestor",
      });
      notify("More information requested");
    },
    [exceptionById, patchException, addActivity, notify]
  );

  const updateRemediationStatus = useCallback(
    (id: string, status: RemediationStatus) => {
      const rem = remediationById.get(id);
      if (!rem) return;
      const progress = status === "New" ? 0 : status === "Assigned" ? 15 : status === "In Progress" ? 55 : status === "Validation" ? 85 : 100;
      patchRemediation(id, { status, progress });
      const vuln = vulnById.get(rem.vulnerabilityId);
      if (vuln) {
        const statusMap: Record<RemediationStatus, VulnerabilityStatus> = {
          New: "New",
          Assigned: "Assigned",
          "In Progress": "Remediating",
          Validation: "Validation",
          Closed: "Closed",
        };
        addActivity({
          user: CURRENT_USER.name,
          userRole: CURRENT_USER.role,
          action: "status_changed",
          entity: vuln.cve,
          entityType: "CVE",
          from: vuln.status,
          to: statusMap[status],
          severity: vuln.severity,
        });
        patchVulnerability(vuln.id, { status: statusMap[status] });
      }
      notify(`Remediation status updated to ${status}`);
    },
    [remediationById, vulnById, patchRemediation, patchVulnerability, addActivity, notify]
  );

  const toggleChecklistItem = useCallback(
    (id: string, itemId: string) => {
      const rem = remediationById.get(id);
      if (!rem) return;
      const checklist = rem.checklist.map((item) => (item.id === itemId ? { ...item, done: !item.done } : item));
      const doneCount = checklist.filter((i) => i.done).length;
      const progress = Math.round((doneCount / checklist.length) * 100);
      patchRemediation(id, { checklist, progress });
    },
    [remediationById, patchRemediation]
  );

  const requestRevalidation = useCallback(
    (id: string) => {
      const rem = remediationById.get(id);
      if (!rem) return;
      patchRemediation(id, { validationResult: "Pending", status: "Validation", progress: Math.max(rem.progress, 85) });
      const vuln = vulnById.get(rem.vulnerabilityId);
      if (vuln) {
        addActivity({
          user: CURRENT_USER.name,
          userRole: CURRENT_USER.role,
          action: "revalidation",
          entity: vuln.cve,
          entityType: "CVE",
          detail: "Revalidation scan requested post-patch deployment",
          severity: vuln.severity,
        });
        patchVulnerability(vuln.id, { status: "Validation" });
      }
      notify("Revalidation requested — scan scheduled for next maintenance window");
    },
    [remediationById, vulnById, patchRemediation, patchVulnerability, addActivity, notify]
  );

  const simulateValidation = useCallback(
    (id: string) => {
      const rem = remediationById.get(id);
      if (!rem) return;
      const checklist = rem.checklist.map((item) => ({ ...item, done: true }));
      patchRemediation(id, {
        validationResult: "Passed",
        lastScanResult: "Not Detected",
        lastScanDate: "2026-09-09",
        status: "Closed",
        progress: 100,
        checklist,
      });
      const vuln = vulnById.get(rem.vulnerabilityId);
      if (vuln) {
        patchVulnerability(vuln.id, { status: "Closed" });
        addActivity({
          user: "System",
          userRole: "Automation",
          action: "validated",
          entity: vuln.cve,
          entityType: "CVE",
          detail: `Validation scan PASSED for ${vuln.cve} on ${vuln.assetId}`,
          severity: vuln.severity,
        });
        addActivity({
          user: CURRENT_USER.name,
          userRole: CURRENT_USER.role,
          action: "closed",
          entity: vuln.cve,
          entityType: "CVE",
          from: "Validation",
          to: "Closed",
          detail: "Remediation validated and vulnerability closed",
          severity: vuln.severity,
        });
      }
      notify("Remediation validated successfully");
      window.setTimeout(() => notify("Vulnerability closed"), 600);
    },
    [remediationById, vulnById, patchRemediation, patchVulnerability, addActivity, notify]
  );

  const addComment = useCallback(
    (remediationId: string, text: string, user: string) => {
      const rem = remediationById.get(remediationId);
      if (!rem || !text.trim()) return;
      const comment = { id: nextId("CMT"), user, time: "09 Sep 2026, now", text };
      patchRemediation(remediationId, { comments: [comment, ...rem.comments] });
    },
    [remediationById, patchRemediation]
  );

  const importScan = useCallback(
    (scanner: string, file: string, recordCount?: number): ScannerImport => {
      const records = recordCount ?? 2000 + Math.floor(Math.random() * 3500);
      const invalid = Math.floor(records * 0.008);
      const duplicates = Math.floor(records * 0.42);
      const newFindings = Math.floor(records * 0.22);
      const updated = records - invalid - duplicates - newFindings;
      const record: ScannerImport = {
        id: nextId("IMP"),
        scanner,
        file,
        records,
        newFindings,
        duplicates,
        updated: Math.max(0, updated),
        invalid,
        date: "2026-09-09",
        status: "Processed",
        duration: `${1 + Math.floor(Math.random() * 3)}m ${String(Math.floor(Math.random() * 59)).padStart(2, "0")}s`,
        findingType: getFindingTypeForScanner(scanner),
      };
      setScannerImports((prev) => [record, ...prev]);
      addActivity({
        user: "System",
        userRole: "Automation",
        action: "import",
        entity: file,
        entityType: "Import",
        detail: `${scanner} scan: ${records.toLocaleString()} records — ${newFindings.toLocaleString()} new findings`,
      });
      notify(`${scanner} import processed — ${newFindings.toLocaleString()} new findings`);
      return record;
    },
    [addActivity, notify]
  );

  const addUserAccount = useCallback(
    (input: UserAccount): boolean => {
      const username = input.username.trim();
      if (!username) return false;
      const exists = userAccounts.some((u) => u.username.toLowerCase() === username.toLowerCase());
      if (exists) {
        notify(`Username "${username}" already exists`);
        return false;
      }
      setUserAccounts((prev) => [...prev, { ...input, username }]);
      addActivity({
        user: CURRENT_USER.name,
        userRole: CURRENT_USER.role,
        action: "comment",
        entity: username,
        entityType: "System",
        detail: `User account created — ${username} (${input.role})`,
      });
      notify(`User "${username}" added`);
      return true;
    },
    [userAccounts, addActivity, notify]
  );

  const updateUserAccount = useCallback(
    (originalUsername: string, input: UserAccount): boolean => {
      const username = input.username.trim();
      if (!username) return false;
      const conflict = userAccounts.some((u) => u.username.toLowerCase() === username.toLowerCase() && u.username.toLowerCase() !== originalUsername.toLowerCase());
      if (conflict) {
        notify(`Username "${username}" already exists`);
        return false;
      }
      setUserAccounts((prev) => prev.map((u) => (u.username === originalUsername ? { ...input, username } : u)));
      notify(`User "${username}" updated`);
      return true;
    },
    [userAccounts, notify]
  );

  const deleteUserAccount = useCallback(
    (username: string) => {
      setUserAccounts((prev) => prev.filter((u) => u.username !== username));
      notify(`User "${username}" deleted`);
    },
    [notify]
  );

  const matchDiscovery = useCallback(
    (discoveryId: string, assetId: string) => {
      const discovery = discoveryById.get(discoveryId);
      const asset = assetById.get(assetId);
      if (!discovery || !asset) return;
      setAssetDiscovery((prev) => prev.map((d) => (d.id === discoveryId ? { ...d, status: "Matched", matchedAssetId: assetId } : d)));
      addActivity({
        user: CURRENT_USER.name,
        userRole: CURRENT_USER.role,
        action: "comment",
        entity: discovery.assetName,
        entityType: "System",
        detail: `Discovery matched to existing asset ${asset.name}`,
      });
      notify(`Matched to ${asset.name}`);
    },
    [discoveryById, assetById, addActivity, notify]
  );

  const createAssetFromDiscovery = useCallback(
    (discoveryId: string, input: NewAssetInput): Asset => {
      const discovery = discoveryById.get(discoveryId);
      const today = "2026-09-13";
      const asset: Asset = {
        id: nextId("AST"),
        name: input.name,
        type: input.type,
        environment: input.environment,
        applicationId: input.applicationId || "",
        businessUnit: input.businessUnit || "Unassigned",
        criticality: input.criticality,
        ip: discovery?.ipAddress || "",
        os: "Unknown",
        owner: input.owner,
        lastScan: today,
        slaStatus: "Within SLA",
        hostname: discovery?.hostname,
        status: "Active",
        internetFacing: false,
        discoverySource: discovery?.discoverySource ?? "Manual Import",
        firstSeen: discovery?.discoveredAt ?? today,
        lastSeen: today,
      };
      setAssets((prev) => [...prev, asset]);
      if (discovery) {
        setAssetDiscovery((prev) => prev.map((d) => (d.id === discoveryId ? { ...d, status: "Matched", matchedAssetId: asset.id } : d)));
      }
      addActivity({
        user: CURRENT_USER.name,
        userRole: CURRENT_USER.role,
        action: "comment",
        entity: asset.name,
        entityType: "System",
        detail: `Asset added to inventory from ${discovery?.discoverySource ?? "manual entry"}`,
      });
      notify(`${asset.name} added to Asset Inventory`);
      return asset;
    },
    [discoveryById, addActivity, notify]
  );

  const ignoreDiscovery = useCallback(
    (discoveryId: string) => {
      const discovery = discoveryById.get(discoveryId);
      if (!discovery) return;
      setAssetDiscovery((prev) => prev.map((d) => (d.id === discoveryId ? { ...d, status: "Ignored" } : d)));
      notify(`Discovery record for ${discovery.assetName} ignored`);
    },
    [discoveryById, notify]
  );

  const value: DataContextValue = {
    vulnerabilities,
    assets,
    applications,
    remediations,
    exceptions,
    scannerImports,
    activities,
    users,
    userAccounts,
    apis,
    cloudAssets,
    assetRelationships,
    assetDiscovery,
    getVulnerability: (id) => vulnById.get(id),
    getAsset: (id) => assetById.get(id),
    getApplication: (id) => applicationById.get(id),
    getRemediation: (id) => remediationById.get(id),
    getRemediationForVuln: (vulnerabilityId) => remediations.find((r) => r.vulnerabilityId === vulnerabilityId),
    getException: (id) => exceptionById.get(id),
    getApi: (id) => apiById.get(id),
    getCloudAsset: (id) => cloudAssetById.get(id),
    addActivity,
    completeTriage,
    mergeDuplicate,
    keepSeparate,
    assignOwner,
    approveException,
    rejectException,
    requestMoreInfo,
    updateRemediationStatus,
    toggleChecklistItem,
    requestRevalidation,
    simulateValidation,
    addComment,
    importScan,
    addUserAccount,
    updateUserAccount,
    deleteUserAccount,
    matchDiscovery,
    createAssetFromDiscovery,
    ignoreDiscovery,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData must be used within DataProvider");
  return ctx;
}
