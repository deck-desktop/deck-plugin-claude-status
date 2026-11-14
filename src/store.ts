// Per chat, which band the chips have open. In memory: not worth keeping past a reload.
import { useCallback, useSyncExternalStore } from "react";

export type Band = "limits" | "branch" | "changes" | null;
export interface PaneState {
  band: Band;
}

const EMPTY: PaneState = { band: null };
const states = new Map<string, PaneState>();
const subs = new Map<string, Set<() => void>>();

export const stateOf = (pane: string) => states.get(pane) ?? EMPTY;

export function patch(pane: string, part: Partial<PaneState>) {
  states.set(pane, { ...stateOf(pane), ...part });
  subs.get(pane)?.forEach((f) => f());
}

/** Opens a band, or closes it when it is the one open. */
export const toggleBand = (pane: string, band: Band) => patch(pane, { band: stateOf(pane).band === band ? null : band });

export function usePaneState(pane: string): PaneState {
  const sub = useCallback((f: () => void) => {
    let s = subs.get(pane);
    if (!s) subs.set(pane, s = new Set());
    s.add(f);
    return () => { s!.delete(f); };
  }, [pane]);
  return useSyncExternalStore(sub, () => stateOf(pane));
}
