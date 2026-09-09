import Papa from "papaparse";

/**
 * Parses raw CSV text. Each lib/csv/*.ts loader imports its file directly
 * (e.g. `import raw from "@/data/csv/vulnerabilities.csv"`), compiled into
 * the JS bundle via the webpack asset/source rule in next.config.ts, rather
 * than reading it from disk with fs at runtime. A prior fs.readFileSync-based
 * approach worked locally but produced a serverless bundle on Vercel missing
 * the data/ directory (untraceable dynamic file path), causing a runtime
 * ENOENT that only showed up once deployed.
 */
export function parseCsv<T = Record<string, string>>(raw: string): T[] {
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
