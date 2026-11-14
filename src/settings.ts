// What a user can change about the chips: which show, which usage limit the chip shows, the model a
// tidy uses, and how long captures are kept. Deck draws these rows on the plugin's page of Settings
// and keeps the values in its `settings` config; this reads them, and again whenever it changes.
import { useSyncExternalStore } from "react";
import { configRead } from "deck-plugin-sdk/bridge";
import { listen } from "deck-plugin-sdk/event";

/** On the plugin's own page of Settings (no Deck group is named "chat"). */
const IN = "chat";
export const settings = [
  { in: IN, key: "branch", title: "Branch", desc: "The git branch of Claude's folder, to switch or commit.", default: true },
  { in: IN, key: "lines", title: "Lines changed", desc: "Lines Claude added and removed in the session.", default: true },
  { in: IN, key: "usage", title: "Usage limit", desc: "How much of a usage limit is used.", default: true },
  { in: IN, key: "cost", title: "Cost", desc: "What the session has cost so far.", default: true },
  { in: IN, key: "limit", title: "Usage limit shown", desc: "The other one is in the band the chip opens.",
    choices: [["five_hour", "Five-hour session"], ["seven_day", "Weekly"]], default: "five_hour" },
  { in: IN, key: "time", title: "Session time", desc: "How long the session has run; a click copies the command that resumes it.", default: true },
  { in: IN, key: "phone", title: "Capture the phone's screen", desc: "A button that puts the connected phone's screen in the message (adb).", default: true },
  { in: IN, key: "snip", title: "Snip the screen", desc: "A button that puts a snip of this screen in the message (Windows).", default: true },
  { in: IN, key: "tidy", title: "Tidy the draft", desc: "A button that has Claude rewrite your draft into a clear request, without sending it.", default: true },
  { in: IN, key: "tidyModel", title: "Model for tidying",
    choices: [["sonnet", "Sonnet"], ["haiku", "Haiku (faster)"], ["opus", "Opus"]], default: "sonnet" },
  { in: IN, key: "keep", title: "Keep captures for",
    choices: [["1", "A day"], ["7", "A week"]], default: "1" },
] as const;

type Row = (typeof settings)[number];
export type Settings = { [R in Row as R["key"]]: R extends { choices: readonly (readonly [infer V, string])[] } ? V : boolean };

const defaults = Object.fromEntries(settings.map((r) => [r.key, r.default])) as Settings;
let values: Settings = defaults;
const subs = new Set<() => void>();

const read = () => configRead("settings")
  .then((t) => { values = { ...defaults, ...(t.trim() ? JSON.parse(t) : {}) }; subs.forEach((f) => f()); })
  .catch((e) => console.warn("[chat-status] settings load failed", e));
void read();
// config-changed names a plugin's own config "settings" (the shim drops its data/<id>/ folder).
const unlisten = listen<string[]>("config-changed", (e) => { if (e.payload.includes("settings")) void read(); });

/** Stops listening, before a reload imports the plugin again. */
export const dispose = () => void unlisten.then((f) => f());

export const getSettings = () => values;
export function useSettings(): Settings {
  return useSyncExternalStore((f) => { subs.add(f); return () => { subs.delete(f); }; }, () => values);
}
