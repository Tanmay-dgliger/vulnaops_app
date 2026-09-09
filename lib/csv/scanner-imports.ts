import { readCsv, toNum } from "./parse";
import type { ImportStatus, ScannerImport } from "@/types/scanner-import";

export function getScannerImports(): ScannerImport[] {
  const rows = readCsv<Record<string, string>>("scanner-imports.csv");
  return rows.map((r) => ({
    id: r.id,
    scanner: r.scanner,
    file: r.file,
    records: toNum(r.records),
    newFindings: toNum(r.newFindings),
    duplicates: toNum(r.duplicates),
    updated: toNum(r.updated),
    invalid: toNum(r.invalid),
    date: r.date,
    status: r.status as ImportStatus,
    duration: r.duration,
  }));
}
