import raw from "@/data/users.csv";
import { parseCsv } from "./parse";
import type { UserAccount } from "@/types/user-account";

// Lives at data/users.csv (top-level) -- distinct from data/csv/users.csv, which is the
// unrelated "security team member" directory used for ownership/assignment elsewhere.
export function getUserAccounts(): UserAccount[] {
  const rows = parseCsv<Record<string, string>>(raw);
  return rows.map((r) => ({
    username: r.username,
    email: r.email,
    role: r.role,
  }));
}
