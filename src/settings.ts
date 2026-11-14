// What a user can change about the chips: which show, where, and which usage limit the chip shows. Deck draws these rows on the plugin's page of Settings
// and keeps the values in its `settings` config; this reads them, and again whenever it changes.
import { useSyncExternalStore } from "react";
import { configRead } from "deck-plugin-sdk/bridge";
import { listen } from "deck-plugin-sdk/event";

/** On the plugin's own page of Settings (no Deck group is named "chat"). */
const IN = "chat";
export const settings = [
  { in: IN, key: "at", title: "Where the chips sit", desc: "In the message box's row.",
    choices: [["start", "Left, after the model"], ["end", "Right, before send"]], default: "end" },
  { in: IN, key: "branch", title: "Branch", desc: "The git branch of Claude's folder, to switch or commit.", default: true },
  { in: IN, key: "lines", title: "Lines changed", desc: "Lines Claude added and removed in the session.", default: true },
  { in: IN, key: "usage", title: "Usage limit", desc: "How much of a usage limit is used.", default: true },
  { in: IN, key: "cost", title: "Cost", desc: "What the session has cost so far.", default: true },
  { in: IN, key: "limit", title: "Usage limit shown", desc: "The other one is in the band the chip opens.",
    choices: [["five_hour", "Five-hour session"], ["seven_day", "Weekly"]], default: "five_hour" },
  { in: IN, key: "time", title: "Session time", desc: "How long the session has run; a click copies the command that resumes it.", default: true },
  { in: IN, key: "cache", title: "Prompt cache", desc: "How long the session's prompt cache stays warm. Past it, your next message sends the whole context again at full price.", default: true },
] as const;

type Row = (typeof settings)[number];
export type Settings = { [R in Row as R["key"]]: R extends { choices: readonly (readonly [infer V, string])[] } ? V : boolean };

const defaults = Object.fromEntries(settings.map((r) => [r.key, r.default])) as Settings;
let values: Settings = defaults;
const subs = new Set<() => void>();

const read = () => configRead("settings")
  .then((t) => { values = { ...defaults, ...(t.trim() ? JSON.parse(t) : {}) }; subs.forEach((f) => f()); })
  .catch((e) => console.warn("[claude-status] settings load failed", e));
void read();
// config-changed names a plugin's own config "settings" (the shim drops its data/<id>/ folder).
const unlisten = listen<string[]>("config-changed", (e) => { if (e.payload.includes("settings")) void read(); });

/** Stops listening, before a reload imports the plugin again. */
export const dispose = () => void unlisten.then((f) => f());

export function useSettings(): Settings {
  return useSyncExternalStore((f) => { subs.add(f); return () => { subs.delete(f); }; }, () => values);
}
