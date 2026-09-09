import fs from "fs";
import path from "path";
import Papa from "papaparse";

const CSV_DIR = path.join(process.cwd(), "data", "csv");

export function readCsv<T = Record<string, string>>(filename: string): T[] {
  const filePath = path.join(CSV_DIR, filename);
  const raw = fs.readFileSync(filePath, "utf8");
  const result = Papa.parse<T>(raw, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: false,
  });
  return result.data;
}

export function toBool(value: string | undefined): boolean {
  return value === "true";
}

export function toNum(value: string | undefined, fallback = 0): number {
  if (value === undefined || value === "") return fallback;
  const n = Number(value);
  return Number.isNaN(n) ? fallback : n;
}

export function toOptional(value: string | undefined): string | undefined {
  return value === undefined || value === "" ? undefined : value;
}

export function parseJsonArray<T>(value: string | undefined): T[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function parsePipeList(value: string | undefined): string[] {
  if (!value) return [];
  return value.split("|").map((s) => s.trim()).filter(Boolean);
}
