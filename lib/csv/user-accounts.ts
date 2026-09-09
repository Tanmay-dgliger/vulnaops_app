import fs from "fs";
import path from "path";
import Papa from "papaparse";
import type { UserAccount } from "@/types/user-account";

// Lives at data/users.csv (top-level) -- distinct from data/csv/users.csv, which is the
// unrelated "security team member" directory used for ownership/assignment elsewhere.
const USERS_CSV_PATH = path.join(process.cwd(), "data", "users.csv");

export function getUserAccounts(): UserAccount[] {
  const raw = fs.readFileSync(USERS_CSV_PATH, "utf8");
  const result = Papa.parse<Record<string, string>>(raw, { header: true, skipEmptyLines: true });
  return result.data.map((r) => ({
    username: r.username,
    email: r.email,
    role: r.role,
  }));
}
