// Claude status: what Claude Code's status line says about a chat's session, as chips in its message
// box row (the branch, lines changed, the limits and cost, how long it has run), with captures and
// a tidy for the draft beside them; and a band over the box with more on whichever chip was clicked.
import { useEffect, useState } from "react";
import { GitBranch, Images, Loader2, Scissors, Smartphone, Undo2, WandSparkles, X } from "lucide-react";
import { isWindows, openFile } from "deck-plugin-sdk/bridge";
import { insertInBox, send, useBox, useChat, type Chat } from "deck-plugin-sdk/chat";
import { ChatChip, ChatIconButton, notify } from "deck-plugin-sdk/ui";
import { branchOf, captures, recentBranches, snapPhone, snip, switchBranch, tidy, untidy, type Capture } from "./actions";
import { duration, quote, resets, tone, usd } from "./format";
import { patch, toggleBand, usePaneState } from "./store";

/** The parts of the status line read here (Claude Code writes more; see chat.claude). */
interface Limit { used_percentage?: number; resets_at?: number | string }
const cost = (c: Chat) => c.claude?.cost as { total_cost_usd?: number; total_duration_ms?: number; total_lines_added?: number; total_lines_removed?: number } | undefined;
const limits = (c: Chat) => c.claude?.rate_limits as { five_hour?: Limit; seven_day?: Limit } | undefined;

/** The branch, read again whenever a turn starts or ends (Claude may have switched it). */
function useBranch(cwd: string, working: boolean): string | null {
  const [branch, setBranch] = useState<string | null>(null);
  useEffect(() => {
    let live = true;
    if (cwd) void branchOf(cwd).then((b) => { if (live) setBranch(b); });
    return () => { live = false; };
  }, [cwd, working]);
  return branch;
}

export function ChatChips({ pane }: { pane: string }) {
  const chat = useChat(pane), s = usePaneState(pane), box = useBox(pane);
  const branch = useBranch(chat.cwd, chat.working);
  const c = cost(chat), five = limits(chat)?.five_hour;
  const added = c?.total_lines_added ?? 0, removed = c?.total_lines_removed ?? 0;
  const copyResume = () => {
    const id = chat.claude?.session_id;
    if (id) void navigator.clipboard.writeText(`claude --resume ${id}`)
      .then(() => notify({ kind: "activity", source: "Claude status", title: "Copied the command that resumes this session", transient: true }))
      .catch((e) => console.warn("[chat-status] copying failed", e));
  };
  return (
    <>
      {branch && <ChatChip active={s.band === "branch"} onClick={() => toggleBand(pane, "branch")} title="Branch: switch, or commit"><GitBranch size={12} />{branch}</ChatChip>}
      {(added > 0 || removed > 0) && (
        <ChatChip active={s.band === "changes"} onClick={() => toggleBand(pane, "changes")} title="Lines Claude changed in this session: review or commit them">
          <span style={{ color: "#4ade80" }}>+{added}</span><span style={{ color: "#f87171" }}>−{removed}</span>
        </ChatChip>
      )}
      {(five?.used_percentage != null || c?.total_cost_usd != null) && (
        <ChatChip active={s.band === "limits"} onClick={() => toggleBand(pane, "limits")} title="Your usage limits and this session's cost">
          {five?.used_percentage != null && <span><span className="text-text-muted">5h </span><span style={{ color: tone(five.used_percentage) }}>{five.used_percentage}%</span></span>}
          {c?.total_cost_usd != null && <span>{usd(c.total_cost_usd)}</span>}
        </ChatChip>
      )}
      {c?.total_duration_ms != null && <ChatChip onClick={copyResume} title="How long this session has run. Click to copy the command that resumes it">{duration(c.total_duration_ms)}</ChatChip>}
      <ChatIconButton onClick={() => void snapPhone(pane)} disabled={s.busy === "capture"} aria-label="Capture the phone's screen" title="Capture the connected phone's screen into the message"><Smartphone size={13} /></ChatIconButton>
      {isWindows() && <ChatIconButton onClick={() => void snip(pane)} disabled={s.busy === "capture"} aria-label="Snip the screen" title="Snip part of the screen into the message"><Scissors size={13} /></ChatIconButton>}
      <ChatIconButton onClick={() => toggleBand(pane, "captures")} aria-label="Recent captures" aria-pressed={s.band === "captures"} title="Recent captures, to add one again"><Images size={13} /></ChatIconButton>
      {s.busy === "tidy"
        ? <ChatIconButton disabled aria-label="Tidying" title="Tidying the draft…"><Loader2 size={13} className="animate-spin" /></ChatIconButton>
        : <ChatIconButton onClick={() => void tidy(pane, chat.cwd)} disabled={!box.text.trim()} aria-label="Tidy the draft" title="Tidy the draft with Claude: clearer, nothing added, not sent"><WandSparkles size={13} /></ChatIconButton>}
      {s.tidy && box.text === s.tidy.tidied && <ChatIconButton onClick={() => untidy(pane)} aria-label="Undo the tidy" title="Put the draft from before the tidy back"><Undo2 size={13} /></ChatIconButton>}
    </>
  );
}

const card = "flex w-full flex-col gap-2 rounded-[12px] bg-card px-3 py-2.5 text-[12px] shadow-[inset_0_0_0_1px_var(--border-strong)]";

function Head({ pane, title }: { pane: string; title: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="font-medium text-text-primary">{title}</span>
      <span className="flex-1" />
      <button onClick={() => patch(pane, { band: null })} aria-label="Close" title="Close" className="grid size-5 place-items-center rounded text-text-muted hover:bg-white/10 hover:text-text-primary"><X size={12} /></button>
    </div>
  );
}

function Bar({ name, limit, withDay }: { name: string; limit?: Limit; withDay: boolean }) {
  const pct = limit?.used_percentage;
  return (
    <div className="flex items-center gap-3">
      <span className="w-16 shrink-0 text-text-secondary">{name}</span>
      {pct == null ? <span className="text-text-muted">Not known yet</span> : (
        <>
          <span className="h-1.5 w-40 overflow-hidden rounded-full bg-elev"><span className="block h-full rounded-full" style={{ width: `${Math.min(pct, 100)}%`, background: tone(pct) }} /></span>
          <span className="w-10 text-right tabular-nums text-text-primary">{pct}%</span>
          {resets(limit?.resets_at, withDay) && <span className="text-text-muted">resets {resets(limit?.resets_at, withDay)}</span>}
        </>
      )}
    </div>
  );
}

function Captures({ pane }: { pane: string }) {
  const [list, setList] = useState<Capture[] | null>(null);
  useEffect(() => { void captures().then(setList).catch((e) => { console.warn("[chat-status] listing captures failed", e); setList([]); }); }, []);
  if (!list) return <span className="text-text-muted">Loading…</span>;
  if (!list.length) return <span className="text-text-muted">No captures in the last day. Capture the phone's screen or snip this one with the buttons below.</span>;
  return (
    <div className="flex flex-wrap gap-1.5">
      {list.map((c) => (
        <span key={c.path} className="flex items-center">
          <ChatChip onClick={() => { insertInBox(pane, quote(c.path)); patch(pane, { band: null }); }} title={`Add to the message: ${c.path}`}>{c.label}</ChatChip>
          <button onClick={() => void openFile(c.path).catch((e) => console.warn("[chat-status] opening a capture failed", e))} className="px-1.5 text-[11px] text-text-muted hover:text-text-primary" title="Open it">view</button>
        </span>
      ))}
    </div>
  );
}

function Branches({ pane, cwd }: { pane: string; cwd: string }) {
  const [current, setCurrent] = useState<string | null>(null);
  const [list, setList] = useState<string[]>([]);
  const load = () => void branchOf(cwd).then(async (b) => { setCurrent(b); setList(await recentBranches(cwd, b)); });
  useEffect(load, [cwd]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {list.map((b) => <ChatChip key={b} onClick={() => void switchBranch(cwd, b).then((ok) => { if (ok) patch(pane, { band: null }); })} title={`Switch to ${b}`}>{b}</ChatChip>)}
      {!list.length && <span className="text-text-muted">{current ? "No other local branches." : "Not a git repository."}</span>}
      <span className="flex-1" />
      <ChatChip onClick={() => { void send(pane, "Commit my uncommitted changes with a clear commit message."); patch(pane, { band: null }); }}>Ask Claude to commit</ChatChip>
    </div>
  );
}

export function ChatBand({ pane }: { pane: string }) {
  const chat = useChat(pane), s = usePaneState(pane);
  if (!s.band) return null;
  const ask = (text: string) => { void send(pane, text); patch(pane, { band: null }); };
  return (
    <div className={card}>
      {s.band === "limits" && (
        <>
          <Head pane={pane} title="Usage" />
          <Bar name="Session" limit={limits(chat)?.five_hour} withDay={false} />
          <Bar name="Weekly" limit={limits(chat)?.seven_day} withDay />
          {cost(chat)?.total_cost_usd != null && <span className="text-text-secondary">This session so far: {usd(cost(chat)!.total_cost_usd!)}</span>}
        </>
      )}
      {s.band === "captures" && (<><Head pane={pane} title="Recent captures" /><Captures pane={pane} /></>)}
      {s.band === "branch" && (<><Head pane={pane} title="Branch" /><Branches pane={pane} cwd={chat.cwd} /></>)}
      {s.band === "changes" && (
        <>
          <Head pane={pane} title="Changes in this session" />
          <div className="flex flex-wrap gap-1.5">
            <ChatChip onClick={() => ask("Review my uncommitted changes (git diff HEAD) for bugs and anything worth simplifying.")}>Ask Claude to review them</ChatChip>
            <ChatChip onClick={() => ask("Commit my uncommitted changes with a clear commit message.")}>Ask Claude to commit them</ChatChip>
          </div>
        </>
      )}
    </div>
  );
}
