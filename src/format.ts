// How the chips and the band write what Claude Code's status line says. Pure, so format.check.mjs
// calls it directly.

/** 1234 -> "1.2k". */
export const k = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n));

/** Hours and minutes: "42m", "1h 22m", and "1h" on the hour rather than "1h 0m". */
const hm = (minutes: number) => {
  const h = Math.floor(minutes / 60), m = minutes % 60;
  return h > 0 ? (m ? `${h}h ${m}m` : `${h}h`) : `${m}m`;
};

/** A session's length: "42m", "1h 22m", "2h". */
export const duration = (ms: number) => hm(Math.floor(ms / 60000));

/** The cost so far: "$0.48", or "$0.0123" while it is under a cent's worth of dollars. */
export const usd = (n: number) => `$${n.toFixed(n < 0.1 ? 4 : 2)}`;

/** Deck's tones (its theme darkens them on a light background, where the pale dark-theme shades
 *  hardly showed): green, amber, red, and the blue of a cold cache. */
export const GREEN = "rgb(var(--tone-green-400))", AMBER = "rgb(var(--tone-amber-400))", RED = "rgb(var(--tone-red-400))", BLUE = "rgb(var(--tone-blue-300))";

/** How full a limit is, as the colour the bar takes: green, then amber past half, red past 80%. */
export const tone = (pct: number) => (pct >= 80 ? RED : pct >= 50 ? AMBER : GREEN);

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
/** When a limit resets: "14:05", or "Thu 14:05" for the weekly one. `at` is seconds or an ISO date. */
export function resets(at: number | string | undefined, withDay: boolean): string {
  if (at == null || at === "") return "";
  const d = new Date(typeof at === "number" ? (at < 1e12 ? at * 1000 : at) : at);
  if (Number.isNaN(d.getTime())) return "";
  const t = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  return withDay ? `${DAYS[d.getDay()]} ${t}` : t;
}

/** Time left on the prompt cache, from its `expires_at` (seconds): "48m", "1h 5m", "1h", "40s"; null once
 *  it has run out, when the next message sends the whole context again at full price. */
export function cacheLeft(expiresAt: number, now: number): { ms: number; label: string } | null {
  const ms = expiresAt * 1000 - now;
  if (!(ms > 0)) return null;
  const s = Math.floor(ms / 1000);
  const label = s < 60 ? `${s}s` : hm(Math.floor(s / 60));
  return { ms, label };
}

/** The cache chip's colour: green with time to spare, amber under 10 minutes, red under 3. */
export const cacheTone = (ms: number) => (ms < 180_000 ? RED : ms < 600_000 ? AMBER : GREEN);
