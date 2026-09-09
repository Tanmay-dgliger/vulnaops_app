export type ImportStatus = "Processed" | "Processing" | "Failed" | "Queued";

export interface ScannerImport {
  id: string;
  scanner: string;
  file: string;
  records: number;
  newFindings: number;
  duplicates: number;
  updated: number;
  invalid: number;
  date: string;
  status: ImportStatus;
  duration: string;
}
