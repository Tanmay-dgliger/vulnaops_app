const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** "2026-08-12" -> "12 Aug 2026" */
export function formatDate(dateStr?: string): string {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  return `${String(d.getDate()).padStart(2, "0")} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

export function initials(name: string): string {
  if (!name || name === "—" || name === "System") return name === "System" ? "SY" : "--";
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

const OWNER_COLOR_POOL = ["#1D4ED8", "#7C3AED", "#065F46", "#92400E", "#1E3A5F", "#831843", "#0369A1", "#CA8A04", "#DB2777", "#334155"];

export function ownerColor(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return OWNER_COLOR_POOL[h % OWNER_COLOR_POOL.length];
}
