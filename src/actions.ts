// What the branch chip does: read the branch checked out in Claude's folder, list the recent ones, and
// switch.
import { exec } from "deck-plugin-sdk/bridge";
import { notify } from "deck-plugin-sdk/ui";

const source = "Claude status";
const notice = (title: string) => void notify({ kind: "activity", source, title, transient: true });
const failure = (title: string, body?: string) => void notify({ kind: "error", source, title, body });

/** The branch checked out in `cwd`, or null outside a repository (or on a detached HEAD). */
export async function branchOf(cwd: string): Promise<string | null> {
  const r = await exec("git", ["rev-parse", "--abbrev-ref", "HEAD"], cwd).catch(() => null);
  const b = r?.code === 0 ? r.stdout.trim() : "";
  return b && b !== "HEAD" ? b : null;
}

/** The most recently committed-to local branches, apart from `current`. */
export async function recentBranches(cwd: string, current: string | null): Promise<string[]> {
  const r = await exec("git", ["branch", "--sort=-committerdate", "--format=%(refname:short)"], cwd).catch(() => null);
  return (r?.stdout ?? "").split("\n").map((b) => b.trim()).filter((b) => b && b !== current).slice(0, 6);
}

/** Switches branch; git itself refuses when uncommitted changes would be overwritten. */
export async function switchBranch(cwd: string, to: string): Promise<boolean> {
  const r = await exec("git", ["switch", to], cwd);
  if (r.code === 0) notice(`Switched to ${to}`);
  else failure(`Could not switch to ${to}`, r.stderr.trim().split("\n")[0]);
  return r.code === 0;
}
