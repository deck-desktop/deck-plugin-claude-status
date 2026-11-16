// Claude status: what Claude Code's status line says about a chat's session, as chips in its message
// box row (the branch, lines changed, the usage limit, the cost, how long it has run, how long its prompt
// cache stays warm), and a band over
// the box with more on whichever chip was clicked.
import { useEffect, useState } from "react";
import { Flame, GitBranch, Snowflake, Timer, X } from "lucide-react";
import { send, useChat, type Chat } from "deck-plugin-sdk/chat";
import { ChatChip, notify } from "deck-plugin-sdk/ui";
import { branchOf, recentBranches, switchBranch } from "./actions";
import { BLUE, cacheLeft, cacheTone, duration, GREEN, RED, resets, tone, usd } from "./format";
import { patch, toggleBand, usePaneState } from "./store";
import { useSettings } from "./settings";

/** The folder Claude works in: its status line's, which follows it into one project of a workspace of
 *  several (a `cd api`), as a status line of Claude Code's own finds the branch; the pane's folder until
 *  the first status line has come. */
const folderOf = (chat: Chat) => {
  const st = chat.claude as { cwd?: string; workspace?: { current_dir?: string } } | null;
  return st?.workspace?.current_dir || st?.cwd || chat.cwd;
};

// Its settings, drawn by Deck on its page of Settings; dispose stops their listener before a reload.
export { dispose, settings } from "./settings";

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

/** Where the chips are drawn: the box row's two ends (Deck's ChatChips and ChatChipsEnd), or a line
 *  above the box (in ChatBand). They show in the one their setting names. */
type Place = "start" | "end" | "above";
export const ChatChips = ({ pane }: { pane: string }) => <Chips pane={pane} place="start" />;
export const ChatChipsEnd = ({ pane }: { pane: string }) => <Chips pane={pane} place="end" />;

function Chips({ pane, place }: { pane: string; place: Place }) {
  const chat = useChat(pane), s = usePaneState(pane), cfg = useSettings();
  const here = cfg.at === place;
  // No git run at all where the branch chip is not shown.
  const branch = useBranch(here && cfg.branch ? folderOf(chat) : "", chat.working);
  if (!here) return null;
  const c = cost(chat), limit = limits(chat)?.[cfg.limit];
  const added = c?.total_lines_added ?? 0, removed = c?.total_lines_removed ?? 0;
  const copyResume = () => {
    const id = chat.claude?.session_id;
    if (id) void navigator.clipboard.writeText(`claude --resume ${id}`)
      .then(() => notify({ kind: "activity", source: "Claude status", title: "Copied the command that resumes this session", transient: true }))
      .catch((e) => console.warn("[claude-status] copying failed", e));
  };
  return (
    <>
      {cfg.branch && branch && <ChatChip active={s.band === "branch"} onClick={() => toggleBand(pane, "branch")} title="Branch: switch, or commit"><GitBranch size={12} />{branch}</ChatChip>}
      {cfg.lines && (added > 0 || removed > 0) && (
        <ChatChip active={s.band === "changes"} onClick={() => toggleBand(pane, "changes")} title="Lines Claude changed in this session. Click to ask Claude to review or commit your uncommitted changes">
          <span style={{ color: GREEN }}>+{added}</span><span style={{ color: RED }}>−{removed}</span>
        </ChatChip>
      )}
      {cfg.usage && limit?.used_percentage != null && (
        <ChatChip active={s.band === "limits"} onClick={() => toggleBand(pane, "limits")} title="Your usage limits: click for both, and when they reset">
          <span className="text-text-muted">{cfg.limit === "five_hour" ? "5h" : "Week"}</span>
          <span style={{ color: tone(limit.used_percentage) }}>{limit.used_percentage}%</span>
        </ChatChip>
      )}
      {cfg.cost && c?.total_cost_usd != null && (
        <ChatChip active={s.band === "limits"} onClick={() => toggleBand(pane, "limits")} title="What this session has cost so far">{usd(c.total_cost_usd)}</ChatChip>
      )}
      {cfg.time && c?.total_duration_ms != null && <ChatChip onClick={copyResume} title="How long this session has run. Click to copy the command that resumes it"><Timer size={12} className="text-text-muted" />{duration(c.total_duration_ms)}</ChatChip>}
      {cfg.cache && <CacheChip chat={chat} />}
    </>
  );
}

/** What the status line says of the prompt cache. */
interface PromptCache { expires_at?: number; ttl?: string; recache_tokens_if_cold?: number }

/** How long the session's prompt cache stays warm. Past it, the next message sends the whole context
 *  again at full price, which on a long session costs far more than the message itself. Ticks every
 *  15 s, and every second in the last two minutes; only while it is on screen. */
function CacheChip({ chat }: { chat: Chat }) {
  const cache = chat.claude?.prompt_cache as PromptCache | undefined;
  const [now, setNow] = useState(Date.now);
  const left = cache?.expires_at != null ? cacheLeft(cache.expires_at, now) : null;
  const every = left && left.ms < 120_000 ? 1000 : 15_000;
  useEffect(() => {
    if (cache?.expires_at == null) return;
    const t = setInterval(() => setNow(Date.now()), every);
    return () => clearInterval(t);
  }, [cache?.expires_at, every]);
  if (cache?.expires_at == null) return null;
  const tokens = cache.recache_tokens_if_cold ? `${cache.recache_tokens_if_cold.toLocaleString()} tokens` : "the whole context";
  return left ? (
    <ChatChip title={`Prompt cache warm for ${left.label} more${cache.ttl ? ` (a ${cache.ttl} cache)` : ""}. A message before then reads the context from the cache; after it, ${tokens} are sent again at full price.`}>
      <Flame size={12} style={{ color: cacheTone(left.ms) }} /><span className="text-text-muted">cache</span><span>{left.label}</span>
    </ChatChip>
  ) : (
    <ChatChip title={`Prompt cache expired: your next message sends ${tokens} again at full price. A /clear or a new session starts small.`}>
      <Snowflake size={12} style={{ color: BLUE }} /><span className="text-text-muted">cache cold</span>
    </ChatChip>
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

/** Over the box: the chips on a line of their own (when set there, at its right, by the send button),
 *  then the band a chip opened. */
export function ChatBand({ pane }: { pane: string }) {
  const cfg = useSettings();
  return (
    <>
      {cfg.at === "above" && <div className="flex w-full flex-wrap items-center justify-end gap-1.5"><Chips pane={pane} place="above" /></div>}
      <Band pane={pane} />
    </>
  );
}

function Band({ pane }: { pane: string }) {
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
      {s.band === "branch" && (<><Head pane={pane} title="Branch" /><Branches pane={pane} cwd={folderOf(chat)} /></>)}
      {s.band === "changes" && (
        <>
          <Head pane={pane} title="Uncommitted changes" />
          <div className="flex flex-wrap gap-1.5">
            <ChatChip onClick={() => ask("Review my uncommitted changes (git diff HEAD) for bugs and anything worth simplifying.")}>Ask Claude to review them</ChatChip>
            <ChatChip onClick={() => ask("Commit my uncommitted changes with a clear commit message.")}>Ask Claude to commit them</ChatChip>
          </div>
        </>
      )}
    </div>
  );
}
