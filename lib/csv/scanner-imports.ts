import raw from "@/data/csv/scanner-imports.csv";
import { parseCsv, toNum } from "./parse";
import type { ImportStatus, ScannerImport } from "@/types/scanner-import";

export function getScannerImports(): ScannerImport[] {
  const rows = parseCsv<Record<string, string>>(raw);
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
