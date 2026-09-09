import raw from "@/data/csv/users.csv";
import { parseCsv } from "./parse";
import type { User } from "@/types/user";

export function getUsers(): User[] {
  const rows = parseCsv<Record<string, string>>(raw);
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    role: r.role,
    email: r.email,
    businessUnit: r.businessUnit,
    initials: r.initials,
    color: r.color,
  }));
}
