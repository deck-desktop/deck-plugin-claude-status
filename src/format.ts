// How the chips and the band write what Claude Code's status line says. Pure, so format.check.mjs
// calls it directly.

/** 1234 -> "1.2k". */
export const k = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n));

/** A session's length: "42m", "1h 22m". */
export function duration(ms: number): string {
  const minutes = Math.floor(ms / 60000), hours = Math.floor(minutes / 60);
  return hours > 0 ? `${hours}h ${minutes % 60}m` : `${minutes}m`;
}

/** The cost so far: "$0.48", or "$0.0123" while it is under a cent's worth of dollars. */
export const usd = (n: number) => `$${n.toFixed(n < 0.1 ? 4 : 2)}`;

/** How full a limit is, as the colour the bar takes: green, then amber past half, red past 80%. */
export const tone = (pct: number) => (pct >= 80 ? "#f87171" : pct >= 50 ? "#fbbf24" : "#4ade80");

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
/** When a limit resets: "14:05", or "Thu 14:05" for the weekly one. `at` is seconds or an ISO date. */
export function resets(at: number | string | undefined, withDay: boolean): string {
  if (at == null || at === "") return "";
  const d = new Date(typeof at === "number" ? (at < 1e12 ? at * 1000 : at) : at);
  if (Number.isNaN(d.getTime())) return "";
  const t = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  return withDay ? `${DAYS[d.getDay()]} ${t}` : t;
}
